extends PlayerState

## Player is dead. Play death animation and disable input.


func enter() -> void:
	player.animation_player.play("death")
	player.velocity = Vector2.ZERO
	player.set_physics_process(false)
	# Notify game manager
	GameManager.on_player_died(player)


func exit() -> void:
	player.set_physics_process(true)
