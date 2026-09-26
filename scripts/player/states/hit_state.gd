extends PlayerState

## Entered when the player takes damage.
## Brief stun before returning to normal state.

var stun_timer: float = 0.0
const STUN_DURATION: float = 0.25


func enter() -> void:
	stun_timer = 0.0
	player.animation_player.play("hit")


func physics_update(delta: float) -> void:
	# Apply friction during hitstun
	player.velocity.x = move_toward(player.velocity.x, 0.0, player.friction * 0.3 * delta)

	stun_timer += delta
	if stun_timer >= STUN_DURATION:
		if player.is_on_floor():
			state_machine.transition_to("IdleState")
		else:
			state_machine.transition_to("FallState")
