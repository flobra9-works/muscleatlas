# Inspect the Z-Anatomy .blend: what collections exist, how objects are named,
# and how many of them there are. Run headless:
#   blender -b vendor/Z-Anatomy/Startup.blend -P scripts/za-inspect.py
import bpy, collections, re, sys

out = []
def p(s):
    out.append(str(s))

p("=== SCENES ===")
for sc in bpy.data.scenes:
    p("scene: %s  objects=%d" % (sc.name, len(sc.objects)))

p("")
p("=== TOP-LEVEL COLLECTION TREE (depth 3, with mesh counts) ===")

def zaehle(coll):
    n = len([o for o in coll.all_objects if o.type == 'MESH'])
    return n

def baum(coll, tiefe=0, max_tiefe=3):
    if tiefe > max_tiefe:
        return
    p("%s%s  [meshes: %d, direct children: %d]" %
      ("  " * tiefe, coll.name, zaehle(coll), len(coll.children)))
    for kind in coll.children:
        baum(kind, tiefe + 1, max_tiefe)

for sc in bpy.data.scenes:
    baum(sc.collection)

p("")
p("=== TOTALS ===")
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
p("mesh objects total: %d" % len(meshes))
p("collections total: %d" % len(bpy.data.collections))

p("")
p("=== COLLECTIONS WHOSE NAME LOOKS MUSCLE-RELATED ===")
muskelwort = re.compile(r'muscl|muscul|myo', re.I)
for c in bpy.data.collections:
    if muskelwort.search(c.name):
        p("  %s  [meshes: %d]" % (c.name, zaehle(c)))

p("")
p("=== SAMPLE OBJECT NAMES (first 60 meshes) ===")
for o in meshes[:60]:
    p("  %s" % o.name)

p("")
p("=== NAMES CONTAINING KEY MUSCLE TERMS (up to 12 each) ===")
for term in ["Pectoralis", "Deltoid", "Biceps", "Triceps", "Rectus abdominis",
             "Latissimus", "Trapezius", "Quadriceps", "Vastus", "Gluteus",
             "Gastrocnemius", "Oblique", "Erector", "Adductor", "Soleus"]:
    treffer = [o.name for o in meshes if term.lower() in o.name.lower()]
    p("  %-18s %d" % (term + ":", len(treffer)))
    for n in treffer[:12]:
        p("      %s" % n)

text = "\n".join(out)
with open("scripts/za-inspect-out.txt", "w", encoding="utf-8") as f:
    f.write(text)
print(text)
