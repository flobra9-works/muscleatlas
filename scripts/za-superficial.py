# List the "Superficial muscles" collection and the scene bounds, so the muscle
# name -> MuscleAtlas region mapping and the camera can both be built from fact.
#   blender -b vendor/Z-Anatomy/Startup.blend -P scripts/za-superficial.py
import bpy
from mathutils import Vector

out = []
def p(s): out.append(str(s))

ziel = None
for c in bpy.data.collections:
    if c.name.strip().lower() == "superficial muscles":
        ziel = c
        break

if not ziel:
    p("!! no 'Superficial muscles' collection found")
else:
    objs = [o for o in ziel.all_objects if o.type == 'MESH']
    p("=== Superficial muscles: %d meshes ===" % len(objs))
    for o in sorted(objs, key=lambda x: x.name):
        p("  %s" % o.name)

    # World bounds over that collection — needed to frame an orthographic camera.
    lo = Vector(( 1e9,  1e9,  1e9))
    hi = Vector((-1e9, -1e9, -1e9))
    for o in objs:
        for ecke in o.bound_box:
            w = o.matrix_world @ Vector(ecke)
            for i in range(3):
                lo[i] = min(lo[i], w[i]); hi[i] = max(hi[i], w[i])
    p("")
    p("=== WORLD BOUNDS (superficial muscles) ===")
    p("min: %.3f %.3f %.3f" % (lo.x, lo.y, lo.z))
    p("max: %.3f %.3f %.3f" % (hi.x, hi.y, hi.z))
    p("size: %.3f %.3f %.3f" % (hi.x - lo.x, hi.y - lo.y, hi.z - lo.z))

    p("")
    p("=== SUFFIX HISTOGRAM (what .l/.r/.j/.o*/.e* mean for filtering) ===")
    from collections import Counter
    suf = Counter()
    for o in objs:
        teile = o.name.rsplit(".", 1)
        suf[teile[1] if len(teile) == 2 else "(none)"] += 1
    for k, v in sorted(suf.items(), key=lambda x: -x[1]):
        p("  %-8s %d" % (k, v))

text = "\n".join(out)
with open("scripts/za-superficial-out.txt", "w", encoding="utf-8") as f:
    f.write(text)
print(text)
