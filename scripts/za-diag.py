# Why do the muscle surfaces not fill? Dump the display/shading state and a
# sample object's modifiers + material so we fix the real cause, not a guess.
import bpy

sc = bpy.context.scene
sh = sc.display.shading
print("DIAG engine:", sc.render.engine)
print("DIAG film_transparent:", sc.render.film_transparent)
print("DIAG shading.type:", sh.type)
print("DIAG shading.light:", sh.light)
print("DIAG shading.color_type:", sh.color_type)
print("DIAG shading.show_xray:", sh.show_xray)
print("DIAG shading.xray_alpha:", sh.xray_alpha)
print("DIAG shading.show_cavity:", sh.show_cavity)
print("DIAG shading.studio_light:", sh.studio_light)
print("DIAG use_freestyle:", sc.render.use_freestyle)

o = bpy.data.objects.get("Sternocostal head of pectoralis major muscle.l")
if o:
    print("DIAG obj:", o.name)
    print("DIAG   hide_render:", o.hide_render, "hide_viewport:", o.hide_viewport)
    print("DIAG   visible_camera:", getattr(o, "visible_camera", "n/a"))
    print("DIAG   display_type:", o.display_type)
    print("DIAG   show_wire:", o.show_wire)
    print("DIAG   color:", tuple(round(c, 3) for c in o.color))
    print("DIAG   modifiers:", [(m.type, m.name, m.show_render) for m in o.modifiers])
    print("DIAG   verts:", len(o.data.vertices), "polys:", len(o.data.polygons))
    for m in o.data.materials:
        if m:
            print("DIAG   mat:", m.name, "diffuse:", tuple(round(c, 3) for c in m.diffuse_color),
                  "blend:", getattr(m, "blend_method", "n/a"))
else:
    print("DIAG object not found")
