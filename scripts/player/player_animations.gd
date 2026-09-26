extends RefCounted
class_name PlayerAnimations

## Creates all player animations programmatically.
## Called once from Player._ready().
##
## Animations:
##   idle        — breathing bob, subtle arm/weapon sway
##   run         — leg/arm alternation, vertical bob
##   jump        — body stretch, legs tuck, arms reach
##   fall        — arms flail, legs spread
##   double_jump — full backflip with squash/stretch
##   attack_1    — weapon slash arc, lunge, arm extend
##   hit         — white flash, recoil, arm flinch
##   death       — topple over, red flash, fade out


static func setup_animations(anim_player: AnimationPlayer) -> void:
	var lib := AnimationLibrary.new()

	lib.add_animation("RESET", _create_reset())
	lib.add_animation("idle", _create_idle())
	lib.add_animation("run", _create_run())
	lib.add_animation("jump", _create_jump())
	lib.add_animation("fall", _create_fall())
	lib.add_animation("double_jump", _create_double_jump())
	lib.add_animation("attack_1", _create_attack())
	lib.add_animation("hit", _create_hit())
	lib.add_animation("death", _create_death())

	anim_player.add_animation_library("", lib)


# ─── HELPER ───────────────────────────────────────────────────────────────────

static func _track(
		anim: Animation, path: String,
		times: PackedFloat32Array, values: Array,
		interp: int = 1) -> void:
	var t := anim.add_track(Animation.TYPE_VALUE)
	anim.track_set_path(t, path)
	anim.track_set_interpolation_type(t, interp)
	for i in times.size():
		anim.track_insert_key(t, times[i], values[i])


# ─── RESET ────────────────────────────────────────────────────────────────────
# Stores defaults so properties snap back when another animation stops.

static func _create_reset() -> Animation:
	var a := Animation.new()
	a.length = 0.001
	_track(a, "Visual:position",                  PackedFloat32Array([0]), [Vector2.ZERO])
	_track(a, "Visual:rotation",                   PackedFloat32Array([0]), [0.0])
	_track(a, "Visual:scale",                      PackedFloat32Array([0]), [Vector2.ONE])
	_track(a, "Visual/WeaponPivot:rotation",       PackedFloat32Array([0]), [0.0])
	_track(a, ".:modulate",                        PackedFloat32Array([0]), [Color.WHITE])
	_track(a, "Visual/LeftArm:rotation",           PackedFloat32Array([0]), [0.0])
	_track(a, "Visual/RightArm:rotation",          PackedFloat32Array([0]), [0.0])
	_track(a, "Visual/LeftLeg:rotation",           PackedFloat32Array([0]), [0.0])
	_track(a, "Visual/RightLeg:rotation",          PackedFloat32Array([0]), [0.0])
	return a


# ─── IDLE ─────────────────────────────────────────────────────────────────────
# Subtle breathing bob + gentle arm/weapon sway.  1.2 s, loops.

static func _create_idle() -> Animation:
	var a := Animation.new()
	a.length = 1.2
	a.loop_mode = Animation.LOOP_LINEAR

	# Body breathe
	_track(a, "Visual:position",
		PackedFloat32Array([0.0, 0.6, 1.2]),
		[Vector2(0, 0), Vector2(0, -2), Vector2(0, 0)])

	# Weapon sway
	_track(a, "Visual/WeaponPivot:rotation",
		PackedFloat32Array([0.0, 0.6, 1.2]),
		[0.0, 0.05, 0.0])

	# Arms gentle sway
	_track(a, "Visual/LeftArm:rotation",
		PackedFloat32Array([0.0, 0.6, 1.2]),
		[0.0, 0.06, 0.0])
	_track(a, "Visual/RightArm:rotation",
		PackedFloat32Array([0.0, 0.6, 1.2]),
		[0.0, -0.06, 0.0])

	# Legs still
	_track(a, "Visual/LeftLeg:rotation",  PackedFloat32Array([0.0]), [0.0])
	_track(a, "Visual/RightLeg:rotation", PackedFloat32Array([0.0]), [0.0])

	return a


# ─── RUN ──────────────────────────────────────────────────────────────────────
# Legs alternate, arms pump opposite, double-bob per cycle.  0.5 s, loops.

static func _create_run() -> Animation:
	var a := Animation.new()
	a.length = 0.5
	a.loop_mode = Animation.LOOP_LINEAR

	# Vertical bob — two steps per loop
	_track(a, "Visual:position",
		PackedFloat32Array([0.0, 0.125, 0.25, 0.375, 0.5]),
		[Vector2(0, 0), Vector2(0, -4), Vector2(0, 0),
		 Vector2(0, -4), Vector2(0, 0)])

	# Legs alternate stride
	_track(a, "Visual/LeftLeg:rotation",
		PackedFloat32Array([0.0, 0.25, 0.5]),
		[0.5, -0.5, 0.5])
	_track(a, "Visual/RightLeg:rotation",
		PackedFloat32Array([0.0, 0.25, 0.5]),
		[-0.5, 0.5, -0.5])

	# Arms opposite to legs
	_track(a, "Visual/LeftArm:rotation",
		PackedFloat32Array([0.0, 0.25, 0.5]),
		[-0.4, 0.4, -0.4])
	_track(a, "Visual/RightArm:rotation",
		PackedFloat32Array([0.0, 0.25, 0.5]),
		[0.4, -0.4, 0.4])

	return a


# ─── JUMP ─────────────────────────────────────────────────────────────────────
# Body stretches up, legs tuck, arms reach.  0.4 s, one-shot.

static func _create_jump() -> Animation:
	var a := Animation.new()
	a.length = 0.4

	_track(a, "Visual:position",
		PackedFloat32Array([0.0, 0.1, 0.4]),
		[Vector2(0, 0), Vector2(0, -5), Vector2(0, -3)])

	# Legs tuck
	_track(a, "Visual/LeftLeg:rotation",
		PackedFloat32Array([0.0, 0.12, 0.4]),
		[0.0, 0.5, 0.5])
	_track(a, "Visual/RightLeg:rotation",
		PackedFloat32Array([0.0, 0.12, 0.4]),
		[0.0, -0.5, -0.5])

	# Arms reach up
	_track(a, "Visual/LeftArm:rotation",
		PackedFloat32Array([0.0, 0.12, 0.4]),
		[0.0, -0.7, -0.7])
	_track(a, "Visual/RightArm:rotation",
		PackedFloat32Array([0.0, 0.12, 0.4]),
		[0.0, 0.7, 0.7])

	return a


# ─── FALL ─────────────────────────────────────────────────────────────────────
# Arms flail gently, legs spread.  0.6 s, loops.

static func _create_fall() -> Animation:
	var a := Animation.new()
	a.length = 0.6
	a.loop_mode = Animation.LOOP_LINEAR

	# Arms flail
	_track(a, "Visual/LeftArm:rotation",
		PackedFloat32Array([0.0, 0.3, 0.6]),
		[-0.5, -0.25, -0.5])
	_track(a, "Visual/RightArm:rotation",
		PackedFloat32Array([0.0, 0.3, 0.6]),
		[0.25, 0.5, 0.25])

	# Legs spread
	_track(a, "Visual/LeftLeg:rotation",
		PackedFloat32Array([0.0, 0.3, 0.6]),
		[0.15, 0.28, 0.15])
	_track(a, "Visual/RightLeg:rotation",
		PackedFloat32Array([0.0, 0.3, 0.6]),
		[-0.15, -0.28, -0.15])

	return a


# ─── DOUBLE JUMP ──────────────────────────────────────────────────────────────
# Full backflip + squash/stretch burst.  0.4 s, one-shot.

static func _create_double_jump() -> Animation:
	var a := Animation.new()
	a.length = 0.4

	# Full backflip (counter-clockwise = back)
	_track(a, "Visual:rotation",
		PackedFloat32Array([0.0, 0.4]),
		[0.0, -TAU])

	# Squash → stretch → settle
	_track(a, "Visual:scale",
		PackedFloat32Array([0.0, 0.08, 0.2, 0.4]),
		[Vector2(1.2, 0.8), Vector2(0.8, 1.3),
		 Vector2(1.05, 0.95), Vector2(1.0, 1.0)])

	# Lift
	_track(a, "Visual:position",
		PackedFloat32Array([0.0, 0.1, 0.4]),
		[Vector2(0, 0), Vector2(0, -8), Vector2(0, -4)])

	# Legs tuck tight during flip
	_track(a, "Visual/LeftLeg:rotation",
		PackedFloat32Array([0.0, 0.1, 0.35, 0.4]),
		[0.0, 0.7, 0.7, 0.0])
	_track(a, "Visual/RightLeg:rotation",
		PackedFloat32Array([0.0, 0.1, 0.35, 0.4]),
		[0.0, -0.7, -0.7, 0.0])

	return a


# ─── ATTACK 1 ─────────────────────────────────────────────────────────────────
# Weapon slash arc: wind-up → fast slash → recovery.  0.4 s, one-shot.

static func _create_attack() -> Animation:
	var a := Animation.new()
	a.length = 0.4

	# Weapon swing arc: raised → slash down hard
	_track(a, "Visual/WeaponPivot:rotation",
		PackedFloat32Array([0.0, 0.08, 0.15, 0.25, 0.4]),
		[0.8, 0.4, -0.9, -1.1, 0.0])

	# Lunge forward into the swing
	_track(a, "Visual:position",
		PackedFloat32Array([0.0, 0.1, 0.25, 0.4]),
		[Vector2(0, 0), Vector2(12, -2), Vector2(8, 0), Vector2(0, 0)])

	# Right arm extends with the swing
	_track(a, "Visual/RightArm:rotation",
		PackedFloat32Array([0.0, 0.08, 0.2, 0.4]),
		[-0.6, -0.3, 0.5, 0.0])

	# Left arm pulls back for balance
	_track(a, "Visual/LeftArm:rotation",
		PackedFloat32Array([0.0, 0.08, 0.2, 0.4]),
		[0.0, 0.4, 0.5, 0.0])

	# Slight forward lean
	_track(a, "Visual/LeftLeg:rotation",
		PackedFloat32Array([0.0, 0.15, 0.4]),
		[0.0, -0.15, 0.0])
	_track(a, "Visual/RightLeg:rotation",
		PackedFloat32Array([0.0, 0.15, 0.4]),
		[0.0, 0.2, 0.0])

	return a


# ─── HIT ──────────────────────────────────────────────────────────────────────
# Bright white flash, body recoil, arms flinch.  0.25 s, one-shot.

static func _create_hit() -> Animation:
	var a := Animation.new()
	a.length = 0.25

	# White flash → reddish → normal
	_track(a, ".:modulate",
		PackedFloat32Array([0.0, 0.04, 0.12, 0.25]),
		[Color.WHITE, Color(4, 4, 4, 1),
		 Color(1.5, 0.5, 0.5, 1), Color.WHITE])

	# Recoil backward and up
	_track(a, "Visual:position",
		PackedFloat32Array([0.0, 0.06, 0.25]),
		[Vector2(0, 0), Vector2(-10, -4), Vector2(0, 0)])

	# Arms flinch outward
	_track(a, "Visual/LeftArm:rotation",
		PackedFloat32Array([0.0, 0.06, 0.25]),
		[0.0, 0.5, 0.0])
	_track(a, "Visual/RightArm:rotation",
		PackedFloat32Array([0.0, 0.06, 0.25]),
		[0.0, -0.5, 0.0])

	return a


# ─── DEATH ────────────────────────────────────────────────────────────────────
# Topple over, red flash → fade out, limbs go limp.  1.0 s, one-shot.

static func _create_death() -> Animation:
	var a := Animation.new()
	a.length = 1.0

	# Fall over sideways
	_track(a, "Visual:rotation",
		PackedFloat32Array([0.0, 0.4, 1.0]),
		[0.0, 1.2, 1.5708])

	# Red flash then fade
	_track(a, ".:modulate",
		PackedFloat32Array([0.0, 0.08, 0.35, 1.0]),
		[Color.WHITE, Color(3, 0.3, 0.3, 1),
		 Color(1, 1, 1, 1), Color(1, 1, 1, 0.3)])

	# Slide and drop
	_track(a, "Visual:position",
		PackedFloat32Array([0.0, 0.4, 1.0]),
		[Vector2(0, 0), Vector2(8, 12), Vector2(15, 25)])

	# Arms go limp
	_track(a, "Visual/LeftArm:rotation",
		PackedFloat32Array([0.0, 0.5, 1.0]),
		[0.0, 0.6, 0.9])
	_track(a, "Visual/RightArm:rotation",
		PackedFloat32Array([0.0, 0.5, 1.0]),
		[0.0, -0.5, -0.8])

	# Legs collapse
	_track(a, "Visual/LeftLeg:rotation",
		PackedFloat32Array([0.0, 0.5, 1.0]),
		[0.0, 0.4, 0.6])
	_track(a, "Visual/RightLeg:rotation",
		PackedFloat32Array([0.0, 0.5, 1.0]),
		[0.0, -0.3, -0.4])

	return a
