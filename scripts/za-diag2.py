# Apply the same settings the render script does, then report what actually
# stuck — and whether a compositor node tree is overriding the output.
import bpy

sc = bpy.context.scene
print("D2 scenes in file:", [s.name for s in bpy.data.scenes])
print("D2 window scene:", sc.name)

sc.render.engine = 'BLENDER_WORKBENCH'
sc.render.film_transparent = True
sh = sc.display.shading
sh.color_type = 'SINGLE'
sh.single_color = (0.70, 0.17, 0.15)

print("D2 engine after set:", sc.render.engine)
print("D2 film_transparent after set:", sc.render.film_transparent)
print("D2 color_type after set:", sh.color_type)
print("D2 single_color after set:", tuple(round(c, 3) for c in sh.single_color))

print("D2 scene.use_nodes (compositor):", sc.use_nodes)
if sc.use_nodes and sc.node_tree:
    print("D2 compositor nodes:", [(n.type, n.name) for n in sc.node_tree.nodes])
print("D2 view_layers:", [(v.name, v.use) for v in sc.view_layers])
print("D2 render.use_compositing:", sc.render.use_compositing)
print("D2 render.use_sequencer:", sc.render.use_sequencer)
if sc.sequence_editor:
    print("D2 !! sequencer strips:", len(sc.sequence_editor.sequences_all))
print("D2 world:", sc.world.name if sc.world else None)
