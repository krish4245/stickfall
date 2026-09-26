extends Node

## HitManager (Autoload)
## Central hit processing: damage, knockback, hitstop, screen shake, audio, damage numbers, VFX.

signal hit_occurred(hit_data: Dictionary)
signal combo_updated(count: int)

var current_combo: int = 0
var combo_timer: float = 0.0
const COMBO_TIMEOUT: float = 1.8


func _process(delta: float) -> void:
	if current_combo > 0:
		combo_timer -= delta
		if combo_timer <= 0.0:
			current_combo = 0
			combo_updated.emit(0)


func process_hit(hit_data: Dictionary) -> void:
	var victim: Node = hit_data.get("victim")
	var attacker: Node = hit_data.get("attacker")
	var damage: float = hit_data.get("damage", 12.0)
	var knockback_force: float = hit_data.get("knockback_force", 350.0)
	var direction: Vector2 = hit_data.get("direction", Vector2.RIGHT)
	var hit_position: Vector2 = hit_data.get("hit_position", Vector2.ZERO)

	if not victim:
		return

	if victim.get("is_dead") == true:
		return

	# 1. Update Combo
	current_combo += 1
	combo_timer = COMBO_TIMEOUT
	combo_updated.emit(current_combo)

	var is_crit: bool = (current_combo >= 3 and current_combo % 3 == 0)
	var final_damage := damage * (1.5 if is_crit else 1.0)
	var final_knockback := knockback_force * (1.4 if is_crit else 1.0)

	# 2. Apply damage
	var health_comp: Node = victim.get("health_component")
	if not health_comp and victim.has_node("HealthComponent"):
		health_comp = victim.get_node("HealthComponent")
	if health_comp and health_comp.has_method("take_damage"):
		health_comp.take_damage(final_damage)

	# 3. Apply knockback
	if victim.has_method("apply_knockback"):
		victim.apply_knockback(direction, final_knockback)

	# 4. Transition victim to hit state
	var sm: Node = victim.get("state_machine")
	if not sm and victim.has_node("StateMachine"):
		sm = victim.get_node("StateMachine")
	if sm and sm.has_method("transition_to") and not victim.get("is_dead"):
		sm.transition_to("HitState")

	# 5. Mark attacker's attack as landed
	if attacker and "attack_landed" in attacker:
		attacker.attack_landed = true

	# 6. Hitstop (freeze frames)
	var hitstop_time := 0.10 if is_crit else 0.05
	apply_hitstop(hitstop_time)

	# 7. Screen shake
	var shake_amount := 8.0 if is_crit else 4.0
	apply_screen_shake(shake_amount, 0.15)

	# 8. Spawn hit particle effect
	spawn_hit_effect(hit_position)

	# 9. Spawn floating damage number
	spawn_damage_number(hit_position, final_damage, is_crit)

	# 10. Play sound
	if is_crit:
		AudioManager.play_heavy_hit()
	else:
		AudioManager.play_hit()

	hit_occurred.emit(hit_data)


func apply_hitstop(duration: float) -> void:
	Engine.time_scale = 0.05
	await get_tree().create_timer(duration * 0.05, true, false, true).timeout
	Engine.time_scale = 1.0


func apply_screen_shake(intensity: float, duration: float) -> void:
	var camera := get_viewport().get_camera_2d()
	if camera and camera.has_method("shake"):
		camera.shake(intensity, duration)


func spawn_hit_effect(pos: Vector2) -> void:
	var effect_scene := preload("res://scenes/effects/hit_effect.tscn")
	if effect_scene:
		var effect := effect_scene.instantiate()
		effect.global_position = pos
		get_tree().current_scene.add_child(effect)


func spawn_damage_number(pos: Vector2, dmg: float, is_crit: bool) -> void:
	var num_scene := preload("res://scenes/effects/damage_number.tscn")
	if num_scene:
		var num: Node2D = num_scene.instantiate()
		num.global_position = pos
		get_tree().current_scene.add_child(num)
		num.setup(dmg, is_crit)
