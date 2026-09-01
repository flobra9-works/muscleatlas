# Renders the MuscleAtlas body plates from the Z-Anatomy model.
#
#   blender -b vendor/Z-Anatomy/Startup.blend -P scripts/za-render.py -- [--test]
#
# Output: drafts/render/front.png, drafts/render/back.png (transparent background).
#
# Source: Z-Anatomy — the libre 3D atlas of anatomy (CC BY-SA 4.0),
#         itself derived from BodyParts3D (CC BY-SA 2.1 Japan).
# Anything rendered from this is a derivative work and stays CC BY-SA.

import bpy, sys, os, math
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
TEST = "--test" in argv
NUR_ID = "--idonly" in argv

AUS = os.path.abspath("drafts/render")
os.makedirs(AUS, exist_ok=True)

# ---------------------------------------------------------------- muscle set

# Fascia, aponeuroses and tendon sheets are skins that lie OVER the muscles —
# rendering them would hide the pecs and abs entirely.
AUSSCHLUSS = ("fascia", "aponeurosis", "tract", "ligament", "sheath", "bursa")

# The four regions whose muscles are not in the "Superficial muscles" layer,
# pulled in by name from the full muscular system.
ZUSATZ = (
    "rectus abdominis",
    "abdominal part of pectoralis major",
    "erector spinae",
    "adductor longus", "adductor magnus", "adductor brevis",
    "gracilis",
    "thoracolumbar fascia",
    "internal abdominal oblique",
    "serratus posterior",
    "latissimus dorsi",
)

# ...except where the fascia is itself the surface anatomy.
AUSNAHME = ("thoracolumbar",)

def ist_muskel(name):
    n = name.lower()
    if any(a in n for a in AUSNAHME):
        return True
    return not any(w in n for w in AUSSCHLUSS)

def sammle():
    gewaehlt = {}

    oberflaechlich = None
    for c in bpy.data.collections:
        if c.name.strip().lower() == "superficial muscles":
            oberflaechlich = c
            break
    if oberflaechlich:
        for o in oberflaechlich.all_objects:
            if o.type == 'MESH' and ist_muskel(o.name):
                gewaehlt[o.name] = o

    # Add the deep-lying muscles the superficial layer leaves out.
    for o in bpy.data.objects:
        if o.type != 'MESH':
            continue
        n = o.name.lower()
        if any(z in n for z in ZUSATZ) and ist_muskel(o.name):
            # skip attachment markers: .ol/.or = origin, .el/.er = insertion
            suffix = o.name.rsplit(".", 1)[-1] if "." in o.name else ""
            if suffix in ("ol", "or", "el", "er") or suffix.startswith("o") and suffix[1:2].isdigit():
                continue
            gewaehlt[o.name] = o

    return list(gewaehlt.values())

muskeln = sammle()
print("MUSCLES SELECTED: %d" % len(muskeln))
for z in ZUSATZ:
    treffer = [o.name for o in muskeln if z in o.name.lower()]
    print("  ZUSATZ %-34s -> %d %s" % (z, len(treffer), treffer[:4]))

# ---------------------------------------------------------------- visibility

for o in bpy.data.objects:
    o.hide_render = True
    o.hide_viewport = False
for c in bpy.data.collections:
    c.hide_render = False
for o in muskeln:
    o.hide_render = False

# Collections can be excluded from the view layer, which overrides object flags.
def einblenden(lc):
    lc.exclude = False
    lc.hide_viewport = False
    for k in lc.children:
        einblenden(k)
einblenden(bpy.context.view_layer.layer_collection)
for o in bpy.data.objects:
    o.hide_render = o not in muskeln

# ---------------------------------------------------------------- material

# One flat material for everything: the per-muscle colouring in the app is done
# by the SVG overlay, so the plate only has to read as muscle tissue.
mat = bpy.data.materials.new("MA_Muskel")
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()
out = nt.nodes.new("ShaderNodeOutputMaterial")
bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
# Neon Athletic: warm orange-red tissue that sits next to #ff6b2c
bsdf.inputs["Base Color"].default_value = (0.72, 0.16, 0.13, 1.0)
if "Roughness" in bsdf.inputs:
    bsdf.inputs["Roughness"].default_value = 0.62
if "Specular IOR Level" in bsdf.inputs:
    bsdf.inputs["Specular IOR Level"].default_value = 0.3
nt.links.new(bsdf.outputs[0], out.inputs["Surface"])
mat.diffuse_color = (0.72, 0.16, 0.13, 1.0)
mat.roughness = 0.62

for o in muskeln:
    o.data.materials.clear()
    o.data.materials.append(mat)

# ---------------------------------------------------------------- bounds

lo = Vector(( 1e9,  1e9,  1e9))
hi = Vector((-1e9, -1e9, -1e9))
for o in muskeln:
    for ecke in o.bound_box:
        w = o.matrix_world @ Vector(ecke)
        for i in range(3):
            lo[i] = min(lo[i], w[i]); hi[i] = max(hi[i], w[i])
mitte = (lo + hi) / 2.0
hoehe = hi.z - lo.z
breite = hi.x - lo.x
print("BOUNDS min=%s max=%s height=%.3f width=%.3f" % (lo, hi, hoehe, breite))

# ---------------------------------------------------------------- scene setup

sc = bpy.context.scene
sc.render.engine = 'BLENDER_WORKBENCH'
sc.render.film_transparent = True
sc.use_nodes = False
sc.render.use_compositing = False
sc.render.use_sequencer = False
sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_mode = 'RGBA'

shading = sc.display.shading
shading.light = 'STUDIO'
shading.color_type = 'SINGLE'
shading.single_color = (0.76, 0.115, 0.09)
shading.show_xray = False
shading.show_shadows = False
shading.show_cavity = True
shading.cavity_type = 'BOTH'
shading.curvature_ridge_factor = 1.0
shading.curvature_valley_factor = 1.0
sc.display.render_aa = '16'

sc.render.use_freestyle = True
sc.render.line_thickness_mode = 'ABSOLUTE'
sc.render.line_thickness = 0.6
for vl in sc.view_layers:
    vl.use_freestyle = True
    vl.freestyle_settings.crease_angle = math.radians(125)
    if not vl.freestyle_settings.linesets:
        vl.freestyle_settings.linesets.new("MA_Lines")
    for ls in vl.freestyle_settings.linesets:
        ls.select_silhouette = True
        ls.select_border = True
        ls.select_crease = True
        ls.select_edge_mark = False
        if ls.linestyle:
            ls.linestyle.color = (0.16, 0.05, 0.06)
            ls.linestyle.thickness = 1.1
            ls.linestyle.alpha = 0.85

seiten = 1.06                       # margin around the body
sc.render.resolution_y = 1350 if TEST else 2700
sc.render.resolution_x = int(sc.render.resolution_y * (breite * seiten) / (hoehe * seiten))
sc.render.resolution_percentage = 100

cam_data = bpy.data.cameras.new("MA_Cam")
cam_data.type = 'ORTHO'
cam_data.ortho_scale = hoehe * seiten
cam = bpy.data.objects.new("MA_Cam", cam_data)
sc.collection.objects.link(cam)
sc.camera = cam

ABSTAND = 6.0

def stelle_kamera(vorne):
    # Blender figures face -Y, so the front camera sits on -Y looking toward +Y.
    y = mitte.y - ABSTAND if vorne else mitte.y + ABSTAND
    cam.location = (mitte.x, y, mitte.z)
    cam.rotation_euler = (math.radians(90), 0, 0 if vorne else math.radians(180))

def rendere(name, vorne):
    stelle_kamera(vorne)
    sc.render.filepath = os.path.join(AUS, name + ".png")
    bpy.ops.render.render(write_still=True)
    print("WROTE %s (%dx%d)" % (sc.render.filepath, sc.render.resolution_x, sc.render.resolution_y))

# ---------------------------------------------------------------- beauty pass

if not NUR_ID:
    rendere("front", True)
    rendere("back", False)

# ---------------------------------------------------------------- id pass
#
# Same camera, same meshes — so every pixel of the id map corresponds to the
# same pixel of the plate. Each region gets a flat colour whose red channel is
# its index; the app's click regions are traced from this, which is why they
# line up with the artwork by construction instead of by hand.

import importlib.util
spec = importlib.util.spec_from_file_location(
    "za_regions", os.path.join(os.path.dirname(os.path.abspath(__file__)), "za-regions.py"))
za_regions = importlib.util.module_from_spec(spec)
spec.loader.exec_module(za_regions)

# Depth nudges for the id pass only — the artwork is never touched.
#
# Two regions are anatomically buried under a neighbour, so the surface a user
# taps belongs to the wrong muscle:
#   rectus abdominis    lies under the oblique aponeurosis (the visible six-pack)
#   thoracolumbar fascia is the real surface of the lumbar region, but latissimus
#                       overlaps it and would claim every pixel
# Pushing each one a centimetre toward its own camera flips the depth test.
VORDRANG = 0.012        # metres
NUDGE = (
    ("rectus abdominis",     -1),   # toward the front camera (-Y)
    ("thoracolumbar fascia", +1),   # toward the back camera  (+Y)
    ("erector spinae",       +1),
)
for o in muskeln:
    n = o.name.lower()
    for muster, richtung in NUDGE:
        if muster in n:
            o.location = (o.location.x, o.location.y + richtung * VORDRANG, o.location.z)
            print("ID-PASS nudged %s: %s" % ("back" if richtung > 0 else "front", o.name))
            break

farben = za_regions.id_farben()
zugeordnet = {}
for o in muskeln:
    rid = za_regions.region_fuer(o.name)
    if rid and rid in farben:
        r, g, b = farben[rid]
        o.color = (r, g, b, 1.0)
        zugeordnet.setdefault(rid, []).append(o.name)
    else:
        o.color = (0.0, 0.0, 0.0, 1.0)      # unmapped: face, hands, feet
        zugeordnet.setdefault(None, []).append(o.name)

print("REGION MAPPING")
for rid, _ in za_regions.REGIONEN:
    treffer = zugeordnet.get(rid, [])
    print("  %-16s %2d  %s" % (rid, len(treffer), ", ".join(sorted(treffer)[:3])))
print("  %-16s %2d  %s" % ("(unmapped)", len(zugeordnet.get(None, [])),
                           ", ".join(sorted(zugeordnet.get(None, []))[:6])))

shading.light = 'FLAT'
shading.color_type = 'OBJECT'
shading.show_cavity = False
sc.render.use_freestyle = False
sc.display.render_aa = 'OFF'
sc.render.filter_size = 0.01
# 'Raw' keeps linear values untouched, so red = index * 12 exactly.
sc.view_settings.view_transform = 'Raw'
sc.view_settings.look = 'None'

rendere("front-id", True)
rendere("back-id", False)
print("DONE")
