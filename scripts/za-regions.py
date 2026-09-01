# Maps Z-Anatomy object names onto MuscleAtlas region IDs.
#
# The region IDs are the ones already stored in saved workouts — they must never
# change. Matching is by lowercase substring against the object name.
#
# Order matters only in that the first matching region wins, so put the more
# specific patterns first ("biceps brachii" before anything that could catch
# "biceps femoris").

REGIONEN = [
    # --- head / neck ---
    ("nacken", (
        "descending part of trapezius",
        "platysma",
        "sternocleidomastoid",
    )),

    # --- back ---
    ("ruecken-oben", (
        "transverse part of trapezius",
        "ascending part of trapezius",
        "rhomboid",
    )),
    ("lat", (
        "latissimus dorsi",
        "teres major",
    )),
    ("ruecken-unten", (
        "erector spinae",
        "thoracolumbar fascia",
        "serratus posterior inferior",
    )),

    # --- shoulders ---
    ("schulter-vorne",  ("clavicular part of deltoid",)),
    ("schulter-seite",  ("acromial part of deltoid",)),
    ("schulter-hinten", ("scapular spinal part of deltoid", "infraspinatus", "teres minor")),

    # --- chest ---
    ("brust-oben",  ("clavicular head of pectoralis major",)),
    ("brust-mitte", ("sternocostal head of pectoralis major",)),
    ("brust-unten", ("abdominal part of pectoralis major",)),

    # --- arms ---
    ("bizeps",  ("biceps brachii", "brachialis", "coracobrachialis")),
    ("trizeps", ("triceps brachii", "anconeus")),
    ("unterarme", (
        "brachioradialis",
        "extensor carpi", "extensor digitorum", "extensor pollicis",
        "flexor carpi", "flexor digitorum", "flexor pollicis",
        "pronator", "palmaris", "supinator",
    )),

    # --- core ---
    ("bauch",          ("rectus abdominis", "pyramidalis")),
    ("bauch-seitlich", ("external abdominal oblique", "internal abdominal oblique",
                        "serratus anterior", "transversus abdominis")),

    # --- hips / legs ---
    ("gesaess", ("gluteus maximus", "gluteus medius", "gluteus minimus",
                 "tensor fasciae latae")),
    ("quadrizeps", ("rectus femoris", "vastus lateralis", "vastus medialis",
                    "vastus intermedius", "sartorius")),
    ("beinbeuger", ("biceps femoris", "semitendinosus", "semimembranosus")),
    ("adduktoren", ("adductor longus", "adductor magnus", "adductor brevis",
                    "adductor minimus", "gracilis", "pectineus")),

    # Tibialis anterior is the shin rather than the calf, but MuscleAtlas has no
    # separate shin region — the whole lower leg reads as "calves".
    ("waden", ("gastrocnemius", "soleus", "calcaneal tendon",
               "fibularis", "tibialis")),
]

# ID colours for the region pass. Rendered with view_transform 'Raw' and no
# anti-aliasing, so a linear value v lands in the PNG as exactly round(v * 255)
# and the region index decodes back out with no guessing.
SCHRITT = 12          # 20 regions * 12 = 240, comfortably inside 8 bits

def id_farben():
    return {rid: (((i + 1) * SCHRITT) / 255.0, 0.0, 0.0)
            for i, (rid, _) in enumerate(REGIONEN)}


def region_fuer(name):
    n = name.lower()
    for rid, muster in REGIONEN:
        for m in muster:
            if m in n:
                return rid
    return None
