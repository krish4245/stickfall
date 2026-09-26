extends Node
class_name HealthComponent

## Manages a player's health pool.

signal health_changed(new_health: float, max_health: float)
signal died()

@export var max_health: float = 100.0
var current_health: float

@onready var player: Player = owner as Player


func _ready() -> void:
	current_health = max_health


func take_damage(amount: float) -> void:
	if player and player.is_dead:
		return

	current_health = maxf(current_health - amount, 0.0)
	health_changed.emit(current_health, max_health)

	if current_health <= 0.0:
		current_health = 0.0
		died.emit()
		if player:
			player.die()


func heal(amount: float) -> void:
	current_health = minf(current_health + amount, max_health)
	health_changed.emit(current_health, max_health)


func reset() -> void:
	current_health = max_health
	health_changed.emit(current_health, max_health)
