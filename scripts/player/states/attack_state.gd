extends PlayerState

## Basic sword slash attack.
## Startup → Active (hitbox ON) → Recovery → return to Idle/Fall.

var attack_timer: float = 0.0
const STARTUP: float = 0.1
const ACTIVE_START: float = 0.1
const ACTIVE_END: float = 0.25
const TOTAL_DURATION: float = 0.4
var hitbox_active: bool = false


func enter() -> void:
	attack_timer = 0.0
	hitbox_active = false
	player.is_attacking = true
	player.attack_landed = false
	player.animation_player.play("attack_1")
	AudioManager.play_whoosh()


func exit() -> void:
	player.is_attacking = false
	player.hitbox.monitoring = false
	player.hitbox.monitorable = false
	hitbox_active = false


func physics_update(delta: float) -> void:
	# Slow down horizontal movement during attack
	player.velocity.x = move_toward(player.velocity.x, 0.0, player.friction * 0.5 * delta)

	attack_timer += delta

	# Activate hitbox during active frames
	if attack_timer >= ACTIVE_START and attack_timer < ACTIVE_END and not hitbox_active:
		player.hitbox.monitoring = true
		player.hitbox.monitorable = true
		hitbox_active = true

	if attack_timer >= ACTIVE_END and hitbox_active:
		player.hitbox.monitoring = false
		player.hitbox.monitorable = false
		hitbox_active = false

	# Attack finished
	if attack_timer >= TOTAL_DURATION:
		if player.is_on_floor():
			state_machine.transition_to("IdleState")
		else:
			state_machine.transition_to("FallState")
