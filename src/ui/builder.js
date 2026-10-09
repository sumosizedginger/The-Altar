/**
 * src/ui/builder.js — the Altar Builder (Phase 5).
 *
 * Mirrors the Arrangement model into the room: raycast placement with a
 * ghost preview, live verdict chips from the rules engine (teach BEFORE
 * you place), drag-to-move with zone re-checks, rotate/remove, snapshot
 * undo/redo, sandbox-aware flow, and a summary keepsake with screenshot.
 *
 * Pointer contract: the canvas takes pointer events for raycasting and
 * orbiting only; every button/panel is DOM above it. Drags never cross
 * from WebGL back into the DOM.
 */

import * as THREE from "three";
import { EVENTS } from "../core/events.js";
import { SYMBOLS_BY_ID } from "../../data/symbols.js";
import { TOOLS } from "../../data/tools.js";
import { Arrangement } from "../engine/arrangement.js";
import { evaluatePlacement, VERDICT_COPY, ZONES_BY_ID } from "../engine/placement.js";
import { buildItem, zoneMount } from "../engine/props.js";
import { zoneForPoint, ZONE_GEOMETRY } from "../scene/room.js";

const TOOLS_BY_ID = Object.fromEntries(TOOLS.map((t) => [t.id, t]));

const $ = (id) => document.getElementById(id);
const ROOM = { w: 9, d: 12, h: 3.4 };

/** Base height + facing for each zone (mirrors the room's geometry). */
function zoneAnchor(zoneId, hit) {
  switch (zoneId) {
    case "hearth":
      return { y: ZONE_GEOMETRY.hearthMantelY, rotationY: Math.PI / 2 };
    case "floor":
      return { y: 0, rotationY: 0 };
    case "pendant":
      return { y: 1.16, rotationY: 0 };
    case "above-door":
    case "high-wall": {
      const y = Math.min(3.0, Math.max(ZONE_GEOMETRY.highWallMinY, hit.point.y));
      const wall = hit.object.name;
      if (wall.includes("north")) return { y, rotationY: 0, wall: "north" };
      if (wall.includes("east")) return { y, rotationY: -Math.PI / 2, wall: "east" };
      if (wall.includes("west")) return { y, rotationY: Math.PI / 2, wall: "west" };
      return { y, rotationY: Math.PI, wall: "south" };
    }
    default: // altar surfaces
      return { y: ZONE_GEOMETRY.altarTopY, rotationY: 0 };
  }
}

/** Wall offset so wall-mounted plaques sit proud of the surface. */
function applyWallOffset(pos3, wall) {
  const off = 0.035;
  if (wall === "north") pos3.z = -ROOM.d / 2 + off;
  if (wall === "south") pos3.z = ROOM.d / 2 - off;
  if (wall === "east") pos3.x = ROOM.w / 2 - off;
  if (wall === "west") pos3.x = -ROOM.w / 2 + off;
  return pos3;
}

export function initBuilder(handles) {
  const { app, renderer, scene, camera, room, reducedMotion, notice, cameraCtl, audio = null, onItemClick = null } = handles;

  const machine = app.machine;
  const bus = app.bus;
  const arrangement = new Arrangement(bus);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  /* ---- builder-local state ---------------------------------------------- */
  const mode = { kind: null, data: null }; // placing ghost
  const meshes = new Map(); // uid -> {group, instance, mount, defKind, defData}
  let selectedUid = null;
  let ghost = null;
  let ghostZone = null;
  let drag = null; // {uid, fromZone, moved}
  let downAt = null;
  let lastDeniedZone = null;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.16, 0.19, 32),
    new THREE.MeshBasicMaterial({ color: 0xc5a059, transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  ring.raycast = () => {};
  scene.add(ring);

  /* ---- zone markers: the room shows you where things may go ------------- */
  let markerGroup = null;
  let placesToggle = false;

  function buildZoneMarkers() {
    markerGroup = new THREE.Group();
    markerGroup.name = "zone-markers";
    markerGroup.visible = false;

    const mk = (geo, zoneId, pos, { rotY = 0, horizontal = false, base = 0.16 } = {}) => {
      const m = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({
          color: 0xc5a059,
          transparent: true,
          opacity: base,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      m.position.set(pos[0], pos[1], pos[2]);
      if (horizontal) m.rotation.x = -Math.PI / 2;
      m.rotation.y = rotY;
      m.userData.zoneMarker = zoneId;
      m.material.userData.base = base;
      m.raycast = () => {}; // never block surface picking
      markerGroup.add(m);
      return m;
    };
    const plane = (w, h) => new THREE.PlaneGeometry(w, h);
    const disc = (r) => new THREE.CircleGeometry(r, 40);

    const ay = ZONE_GEOMETRY.altarTopY + 0.004;
    mk(disc(0.3), "altar-center", [0, ay, -4.6], { horizontal: true });
    mk(plane(0.5, 0.17), "altar-north", [0, ay, -4.9], { horizontal: true });
    mk(plane(0.5, 0.17), "altar-south", [0, ay, -4.3], { horizontal: true });
    mk(plane(0.17, 0.55), "altar-west", [-0.585, ay, -4.6], { horizontal: true });
    mk(plane(0.17, 0.55), "altar-east", [0.585, ay, -4.6], { horizontal: true });

    mk(disc(2.05), "floor", [0, 0.015, -3.1], { horizontal: true, base: 0.05 });
    mk(new THREE.RingGeometry(2.08, 2.26, 56), "floor", [0, 0.017, -3.1], { horizontal: true });

    // hearth mantel strip — positioned from the live mesh
    const mantel = scene.getObjectByName("hearth-mantel");
    const mp = new THREE.Vector3();
    mantel.getWorldPosition(mp);
    mk(plane(1.34, 0.26), "hearth", [mp.x + 0.04, mp.y + 0.05, mp.z], { rotY: Math.PI / 2 });

    // above the door — south wall over the lintel
    mk(plane(1.1, 0.36), "above-door", [0, 2.45, ROOM.d / 2 - 0.05], { rotY: Math.PI });

    // high walls — one soft panel per wall
    const hy = Math.min(3.0, Math.max(ZONE_GEOMETRY.highWallMinY + 0.55, 2.3));
    mk(plane(1.5, 1.1), "high-wall", [0, hy, -ROOM.d / 2 + 0.05]);
    mk(plane(1.5, 1.1), "high-wall", [0, hy, ROOM.d / 2 - 0.05], { rotY: Math.PI });
    mk(plane(1.5, 1.1), "high-wall", [ROOM.w / 2 - 0.05, hy, 0], { rotY: -Math.PI / 2 });
    mk(plane(1.5, 1.1), "high-wall", [-ROOM.w / 2 + 0.05, hy, 0], { rotY: Math.PI / 2 });

    // pendant stand — a ring around the bar
    mk(new THREE.RingGeometry(0.2, 0.28, 32), "pendant", [1.75, 1.31, 4.9], { horizontal: true });

    scene.add(markerGroup);
  }

  function updateMarkersVisibility() {
    if (!markerGroup) return;
    markerGroup.visible = Boolean(mode.kind) || placesToggle;
  }

  function setMarkerHover(zoneId) {
    if (!markerGroup) return;
    for (const m of markerGroup.children) {
      m.material.opacity = m.userData.zoneMarker === zoneId ? 0.5 : m.material.userData.base;
    }
  }

  buildZoneMarkers();

  /* ---- data dispatch ------------------------------------------------------ */
  const catalog = {
    symbol: (id) => SYMBOLS_BY_ID[id],
    tool: (id) => TOOLS_BY_ID[id],
  };

  function mountFor(zoneId) {
    return zoneMount(zoneId);
  }

  /* ---- mesh mirroring -------------------------------------------------------- */
  function makeMesh(kind, data, mount) {
    const built = buildItem(kind, data, { mount });
    built.group.userData.uid = built.group.userData.uid ?? null;
    return built;
  }

  function addMeshFor(record) {
    const def = catalog[record.kind]?.(record.id);
    if (!def) return null;
    const built = makeMesh(record.kind, def, mountFor(record.zoneId));
    built.group.userData.uid = record.uid;
    built.group.position.set(record.position.x, record.position.y, record.position.z);
    built.group.rotation.y = record.rotationY;
    if (built.instance) {
      if (record._settled || reducedMotion) built.instance.setFinal();
    }
    record._settled = true;
    scene.add(built.group);
    meshes.set(record.uid, { ...built, defKind: record.kind, defData: def });
    return built;
  }

  function disposeMesh(uid) {
    const m = meshes.get(uid);
    if (!m) return;
    scene.remove(m.group);
    m.instance?.dispose();
    meshes.delete(uid);
  }

  /** Full reconcile: the model is the truth; meshes follow it. */
  function reconcile() {
    const seen = new Set();
    for (const record of arrangement.items.values()) {
      seen.add(record.uid);
      const m = meshes.get(record.uid);
      if (!m) {
        addMeshFor({ ...record, _settled: false });
        continue;
      }
      const wantMount = mountFor(record.zoneId);
      if (m.mount !== wantMount) {
        disposeMesh(record.uid);
        addMeshFor({ ...record, _settled: true });
        continue;
      }
      m.group.position.set(record.position.x, record.position.y, record.position.z);
      m.group.rotation.y = record.rotationY;
    }
    for (const uid of [...meshes.keys()]) {
      if (!seen.has(uid)) disposeMesh(uid);
    }
    updateSelectionRing();
    updateCounts();
  }

  function updateCounts() {
    $("place-count").textContent = String(arrangement.size());
  }

  function updateSelectionRing() {
    const m = selectedUid ? meshes.get(selectedUid) : null;
    if (!m) {
      ring.visible = false;
      return;
    }
    ring.visible = true;
    const p = m.group.position;
    ring.position.set(p.x, p.y + 0.008, p.z);
    ring.rotation.x = -Math.PI / 2;
  }

  /* ---- ghost (place preview) ---------------------------------------------------- */
  function setPlacing(kind, data) {
    cancelSelection();
    // any arm-the-hand path (library chip, prompt-place, ritual's place-one)
    // must open the commit path — RITUAL steps aside while you place
    if (machine.state === "RITUAL") machine.transition("PLACING");
    mode.kind = kind;
    mode.data = data;
    destroyGhost();
    bus.emit(EVENTS.BUILDER_MODE, { mode: "placing-item" });
    $("place-hint").hidden = false;
    $("btn-cancel-placing").hidden = false;
    $("place-hint").textContent = `Placing: ${data.name} — aim at a lit marker and click. The room will tell you what convention says before you commit.`;
    highlightCatalogChip(kind, data.id);
    updateMarkersVisibility();
  }

  function destroyGhost() {
    if (!ghost) return;
    scene.remove(ghost.group);
    ghost.instance?.dispose();
    ghost = null;
    ghostZone = null;
  }

  function cancelPlacing() {
    // leaving PLACING deliberately returns to arranging — which lets the
    // ritual resume if a mid-ritual placement was cancelled (instead of
    // stranding the walk in PLACING with every door shut)
    if (machine.state === "PLACING") machine.transition("BUILDING");
    mode.kind = null;
    mode.data = null;
    destroyGhost();
    $("place-hint").hidden = true;
    $("btn-cancel-placing").hidden = true;
    setMarkerHover(null);
    updateMarkersVisibility();
    highlightCatalogChip(null, null);
    bus.emit(EVENTS.BUILDER_MODE, { mode: machine.state === "PLACING" ? "placing" : "building" });
  }

  function buildGhostFor(zoneId) {
    destroyGhost();
    const built = makeMesh(mode.kind, mode.data, mountFor(zoneId));
    const matCache = [];
    built.group.traverse((o) => {
      if (o.material) {
        const m = o.material.clone();
        m.transparent = true;
        m.opacity = 0.45;
        o.material = m;
        matCache.push(m);
      }
      o.castShadow = false;
    });
    built.group.userData.isGhost = true;
    ghost = built;
    ghostZone = zoneId;
    scene.add(built.group);
  }

  /* ---- raycast helpers ---------------------------------------------------------------- */
  function setPointer(e) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
  }

  function hitTest(e, { forPlacing = false } = {}) {
    setPointer(e);
    const hits = raycaster.intersectObjects(scene.children, true);
    for (const hit of hits) {
      // walk up: item roots carry uid, the ghost root carries isGhost
      let o = hit.object;
      let ghostHit = false;
      while (o) {
        if (o.userData?.isGhost) {
          ghostHit = true;
          break;
        }
        if (o.userData?.uid) {
          // while placing, an existing item is part of its zone's surface —
          // the candle goes ON the cloth, so fall through to that zone
          if (forPlacing) {
            const rec = arrangement.get(o.userData.uid);
            if (rec) return { type: "zone", zone: rec.zoneId, hit };
          }
          return { type: "item", uid: o.userData.uid, hit };
        }
        o = o.parent;
      }
      if (ghostHit) continue;
      const name = hit.object.name ?? "";
      const zone = zoneForPoint(hit.point, name);
      if (zone) return { type: "zone", zone, hit };
    }
    return null;
  }

  /* ---- pointer interaction ---------------------------------------------------------------
     Arbitration: an item under the pointer takes priority in BUILDING; everything
     else (orbit / pan / pinch) goes to the camera rig. The rig also owns wheel zoom. */
  const dom = renderer.domElement;

  dom.addEventListener("pointerdown", (e) => {
    downAt = { x: e.clientX, y: e.clientY, camera: false };
    if (e.button === 0 && !e.ctrlKey && !e.metaKey && machine.state === "BUILDING") {
      const hit = hitTest(e);
      if (hit?.type === "item") {
        selectItem(hit.uid);
        drag = { uid: hit.uid, moved: false, lastZone: arrangement.get(hit.uid)?.zoneId };
        dom.setPointerCapture(e.pointerId);
        return;
      }
    }
    cameraCtl.pointerDown(e); // rotate / pan / pinch
    downAt.camera = true;
  });

  dom.addEventListener("pointermove", (e) => {
    /* camera gesture first: the rig consumes the move */
    if (downAt?.camera || cameraCtl.gesture) {
      cameraCtl.pointerMove(e);
      return;
    }

    const hit = hitTest(e, { forPlacing: Boolean(mode.kind) });

    /* placing: ghost follows + verdict chip teaches */
    if (mode.kind) {
      if (hit?.type === "zone") {
        if (hit.zone !== ghostZone) buildGhostFor(hit.zone);
        const anchor = zoneAnchor(hit.zone, hit.hit);
        const p = new THREE.Vector3(hit.hit.point.x, anchor.y, hit.hit.point.z);
        if (anchor.wall) applyWallOffset(p, anchor.wall);
        ghost.group.position.copy(p);
        ghost.group.rotation.y = anchor.rotationY;
        const evaluation = evaluatePlacement({ kind: mode.kind, data: mode.data }, hit.zone);
        const hasRoom = arrangement.zoneHasRoom(hit.zone);
        if (evaluation.verdict === "forbidden" || !hasRoom) {
          ghost.group.position.y = -50; // the ghost refuses to pretend
        }
        showVerdict(evaluation, hasRoom);
        setMarkerHover(hit.zone);
      } else {
        hideVerdict();
        setMarkerHover(null);
        if (ghost) ghost.group.position.y = -50; // park out of sight
      }
      return;
    }

    /* dragging an item across the room */
    if (drag) {
      if (hit?.type === "zone") {
        const record = arrangement.get(drag.uid);
        if (!record) return;
        const anchor = zoneAnchor(hit.zone, hit.hit);
        const evaluation = evaluatePlacement(
          { kind: record.kind, data: { name: record.name, ...record.ruleData } },
          hit.zone,
        );
        const roomLeft = hit.zone === drag.lastZone || arrangement.zoneHasRoom(hit.zone);
        if (!VERDICT_OK(evaluation.verdict) || !roomLeft) {
          if (lastDeniedZone !== hit.zone) {
            lastDeniedZone = hit.zone;
            notice(
              `${evaluation.zoneName}: ${VERDICT_COPY[evaluation.verdict]} — ${
                roomLeft ? evaluation.rationale : "that place is full."
              }`,
            );
          }
          return; // keep last valid pose
        }
        lastDeniedZone = null;
        drag.moved = true;
        drag.pending = {
          zoneId: hit.zone,
          position: (() => {
            const p = new THREE.Vector3(hit.hit.point.x, anchor.y, hit.hit.point.z);
            if (anchor.wall) applyWallOffset(p, anchor.wall);
            return { x: p.x, y: p.y, z: p.z };
          })(),
          rotationY: anchor.rotationY,
        };
        const m = meshes.get(drag.uid);
        m.group.position.set(drag.pending.position.x, drag.pending.position.y, drag.pending.position.z);
        m.group.rotation.y = drag.pending.rotationY;
        updateSelectionRing();
      }
      return;
    }

    /* idle hover: soft zone name for teaching */
    if (hit?.type === "zone") {
      $("hover-zone").textContent = ZONES_BY_ID[hit.zone]?.name ?? hit.zone;
    } else {
      $("hover-zone").textContent = "";
    }
  });

  dom.addEventListener("pointerup", (e) => {
    const wasDown = downAt;
    downAt = null;
    cameraCtl.pointerUp(e);
    const clickDist = wasDown ? Math.hypot(e.clientX - wasDown.x, e.clientY - wasDown.y) : 99;

    if (drag) {
      const d = drag;
      drag = null;
      if (d.moved && d.pending) {
        arrangement.move(d.uid, { position: d.pending.position, zoneId: d.pending.zoneId });
        const record = arrangement.get(d.uid);
        if (record && d.pending.rotationY !== undefined) {
          record.rotationY = d.pending.rotationY;
        }
        reconcile();
      }
      return;
    }

    /* a camera drag that barely moved is still a click */
    if (clickDist >= 6) return;

    if (mode.kind && ["PLACING", "BUILDING"].includes(machine.state)) {
      // commit a placement — judge the click's own hit, not whether a hover
      // ghost happened to spawn (rules + capacity re-checked by the model)
      const hit = hitTest(e, { forPlacing: true });
      if (hit?.type === "zone") {
        const anchor = zoneAnchor(hit.zone, hit.hit);
        const p = new THREE.Vector3(hit.hit.point.x, anchor.y, hit.hit.point.z);
        if (anchor.wall) applyWallOffset(p, anchor.wall);
        const result = arrangement.place({
          kind: mode.kind,
          data: mode.data,
          zoneId: hit.zone,
          position: { x: p.x, y: p.y, z: p.z },
          rotationY: anchor.rotationY,
        });
        if (result.ok) {
          playFor(mode.kind, mode.data, p, 0.8);
          if (machine.state === "PLACING") machine.transition("BUILDING");
          keepPlacingIfShift(e);
        }
      } else {
        notice("Aim at a lit marker — the altar, the rug, the mantel, the walls above, or the pendant stand. Scroll to zoom, drag empty space to look around.");
      }
      return;
    }

    if (machine.state === "BUILDING" || machine.state === "RITUAL") {
      const hit = hitTest(e);
      if (hit?.type === "item") {
        if (machine.state === "BUILDING") playFor(arrangement.get(hit.uid)?.kind, arrangement.get(hit.uid), getWorldPos(hit.uid), 0.45);
        onItemClick?.(hit.uid);
        if (machine.state === "BUILDING") selectItem(hit.uid);
      } else if (machine.state === "BUILDING") {
        cancelSelection();
      }
    }
  });

  function keepPlacingIfShift(e) {
    if (!e.shiftKey) cancelPlacing();
  }

  const VERDICT_OK = (v) => v !== "forbidden";

  dom.addEventListener("pointerleave", () => {
    hideVerdict();
    setMarkerHover(null);
  });

  /* ---- verdict chip ---------------------------------------------------------------------------- */
  function showVerdict(evaluation, hasRoom) {
    const chip = $("verdict-chip");
    chip.hidden = false;
    chip.textContent = `${evaluation.zoneName} — ${VERDICT_COPY[evaluation.verdict]}`;
    chip.dataset.verdict = evaluation.verdict;
    $("verdict-text").textContent = hasRoom ? evaluation.rationale : "That place is full — its capacity is spoken for.";
    $("place-hint").hidden = false;
  }

  function hideVerdict() {
    $("verdict-chip").hidden = true;
    $("verdict-text").textContent = "";
  }

  /* ---- selection --------------------------------------------------------------------------------- */
  function selectItem(uid) {
    selectedUid = uid;
    updateSelectionRing();
    $("item-controls").hidden = false;
    const r = arrangement.get(uid);
    if (r) $("item-controls-label").textContent = `${r.name} — ${ZONES_BY_ID[r.zoneId]?.name ?? r.zoneId}`;
  }

  function cancelSelection() {
    selectedUid = null;
    ring.visible = false;
    $("item-controls").hidden = true;
  }

  /* ---- ritual/audio surface (Phase 6) ---------------------------------- */
  function toolSoundType(uid) {
    const r = arrangement.get(uid);
    if (!r) return "cloth";
    if (r.kind === "symbol") return "chime";
    return TOOLS_BY_ID[r.id]?.sound?.type ?? "cloth";
  }

  function playFor(kind, data, pos, level = 0.7) {
    if (!audio) return;
    const type = kind === "tool" ? data?.sound?.type ?? "cloth" : "chime";
    audio.playAt(type, pos, { level });
  }

  function getWorldPos(uid) {
    const m = meshes.get(uid);
    if (!m) return null;
    const v = new THREE.Vector3();
    m.group.getWorldPosition(v);
    return v;
  }

  function screenPosOf(uid) {
    const p = getWorldPos(uid);
    if (!p) return null;
    const v = p.clone().project(camera);
    if (v.z > 1) return null;
    return {
      x: (v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-v.y * 0.5 + 0.5) * window.innerHeight,
    };
  }

  function setPlacingTool(toolId) {
    const t = TOOLS_BY_ID[toolId];
    if (t) setPlacing("tool", t);
  }

  function replaySymbol(uid) {
    meshes.get(uid)?.instance?.replay();
  }

  /* ---- summary keepsake ---------------------------------------------------------------------------- */
  function renderSummary(ritualRecord = null) {
    // screenshot: render now, capture immediately
    renderer.render(scene, camera);
    const src = renderer.domElement;
    const scale = Math.min(1, 960 / src.width);
    const cv = document.createElement("canvas");
    cv.width = Math.round(src.width * scale);
    cv.height = Math.round(src.height * scale);
    cv.getContext("2d").drawImage(src, 0, 0, cv.width, cv.height);
    const dataUrl = cv.toDataURL("image/png");
    $("summary-img").src = dataUrl;
    $("btn-shot-png").href = dataUrl;

    const list = $("summary-list");
    list.textContent = "";
    for (const it of arrangement.items.values()) {
      const evaluation = evaluatePlacement(
        { kind: it.kind, data: { name: it.name, ...it.ruleData } },
        it.zoneId,
      );
      const li = document.createElement("li");
      li.innerHTML = "";
      li.append(
        Object.assign(document.createElement("strong"), { textContent: it.name }),
        document.createTextNode(` — ${ZONES_BY_ID[it.zoneId]?.name ?? it.zoneId}`),
      );
      const note = document.createElement("div");
      note.className = "summary-note";
      note.textContent = VERDICT_COPY[evaluation.verdict] + " — " + evaluation.rationale;
      li.append(note);
      list.append(li);
    }
    if (!arrangement.size()) {
      list.append(Object.assign(document.createElement("li"), { textContent: "An empty altar — a beginning, too." }));
    }

    if (ritualRecord) {
      const h = document.createElement("h3");
      h.textContent = "The ritual — what was walked";
      list.append(h);
      const ol = document.createElement("ol");
      for (const st of ritualRecord.steps ?? []) {
        const li = document.createElement("li");
        li.textContent = st.skipped
          ? `${st.id} — set aside`
          : `${st.id} — ${st.via}${st.substituteUsed ? " (substitute)" : ""}`;
        ol.append(li);
      }
      list.append(ol);
      const notes = document.createElement("p");
      notes.className = "summary-note";
      notes.textContent = (ritualRecord.notes ?? []).join(" · ");
      list.append(notes);
    }

    const blob = new Blob(
      [JSON.stringify({ arrangement: arrangement.serialize(), ritual: ritualRecord }, null, 2)],
      { type: "application/json" },
    );
    $("btn-shot-json").href = URL.createObjectURL(blob);
  }

  /* ---- catalog DOM ------------------------------------------------------------------------------------ */
  function buildCatalog() {
    const symWrap = $("catalog-symbols");
    const toolWrap = $("catalog-tools");
    symWrap.textContent = "";
    toolWrap.textContent = "";
    for (const s of Object.values(SYMBOLS_BY_ID)) {
      symWrap.append(catalogChip("symbol", s.id, s.name));
    }
    for (const t of Object.values(TOOLS_BY_ID)) {
      toolWrap.append(catalogChip("tool", t.id, t.name));
    }
    $("catalog-count").textContent = `${Object.keys(SYMBOLS_BY_ID).length} symbols · ${Object.keys(TOOLS_BY_ID).length} tools`;
  }

  function catalogChip(kind, id, name) {
    const b = document.createElement("button");
    b.className = "cat-chip";
    b.dataset.kind = kind;
    b.dataset.id = id;
    b.textContent = name;
    b.addEventListener("click", () => {
      if (mode.kind === kind && mode.data?.id === id) cancelPlacing();
      else setPlacing(kind, catalog[kind](id));
    });
    return b;
  }

  function highlightCatalogChip(kind, id) {
    for (const b of document.querySelectorAll(".cat-chip")) {
      b.classList.toggle("active", b.dataset.kind === kind && b.dataset.id === id);
    }
  }

  /* ---- undo/redo + keyboard ------------------------------------------------------------------------------ */
  function doUndo() {
    if (!arrangement.undo()) notice("Nothing to unmake — the arrangement is as it began.");
  }

  function doRedo() {
    if (!arrangement.redo()) notice("Nothing remade yet.");
  }

  document.addEventListener("keydown", (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
      e.preventDefault();
      doUndo();
    } else if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") || ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "z")) {
      e.preventDefault();
      doRedo();
    } else if (e.key === "Escape") {
      if (mode.kind) cancelPlacing();
      else cancelSelection();
    } else if ((e.key === "Delete" || e.key === "Backspace") && selectedUid) {
      arrangement.remove(selectedUid);
      cancelSelection();
    } else if (e.key.toLowerCase() === "r" && selectedUid && !e.metaKey && !e.ctrlKey) {
      arrangement.rotate(selectedUid, e.shiftKey ? -Math.PI / 12 : Math.PI / 12);
    }
  });

  /* ---- bus wiring ----------------------------------------------------------------------------------------- */
  bus.on(EVENTS.ARRANGEMENT_CHANGE, reconcile);
  bus.on(EVENTS.ARRANGEMENT_UNDONE, reconcile);
  bus.on(EVENTS.ARRANGEMENT_REDONE, reconcile);
  bus.on(EVENTS.PLACEMENT_NOTED, ({ rationale }) => notice(`Placed, with care — ${rationale}`));
  bus.on(EVENTS.PLACEMENT_DENIED, ({ reason }) => notice(reason));

  $("btn-undo").addEventListener("click", doUndo);
  $("btn-redo").addEventListener("click", doRedo);
  $("btn-places").addEventListener("click", () => {
    placesToggle = !placesToggle;
    $("btn-places").classList.toggle("active", placesToggle);
    $("btn-places").setAttribute("aria-pressed", String(placesToggle));
    updateMarkersVisibility();
  });
  $("btn-rot-l").addEventListener("click", () => selectedUid && arrangement.rotate(selectedUid, -Math.PI / 12));
  $("btn-rot-r").addEventListener("click", () => selectedUid && arrangement.rotate(selectedUid, Math.PI / 12));
  $("btn-remove").addEventListener("click", () => {
    if (selectedUid) arrangement.remove(selectedUid);
    cancelSelection();
  });
  $("btn-deselect").addEventListener("click", cancelSelection);
  $("btn-cancel-placing").addEventListener("click", cancelPlacing);
  $("btn-summary").addEventListener("click", () => machine.transition("SUMMARY"));
  $("btn-begin-anew").addEventListener("click", () => {
    arrangement.clear();
    machine.reset();
  });
  $("sandbox-toggle").addEventListener("change", (e) => {
    machine.setSandbox(e.target.checked);
    e.target.checked = machine.sandbox;
  });

  buildCatalog();
  reconcile();

  return {
    arrangement,
    renderSummary,
    cancelPlacing,
    getWorldPos,
    screenPosOf,
    setPlacingTool,
    replaySymbol,
  };
}
