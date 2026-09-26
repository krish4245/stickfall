extends Node2D
class_name Arena

## Arena — holds platforms, spawn points, boundaries, and background.

@export var arena_name: String = "The Pit"
@export var spawn_points: Array[Marker2D] = []
@export var arena_bounds: Rect2 = Rect2(-1600, -900, 3200, 1800)


func _ready() -> void:
	if has_node("KillZone"):
		$KillZone.body_entered.connect(_on_killzone_body_entered)


func _on_killzone_body_entered(body: Node2D) -> void:
	if body is Player:
		if body.health_component:
			body.health_component.take_damage(999.0)
	elif body.has_method("reset_dummy"):
		body.reset_dummy()


func get_spawn_position(index: int) -> Vector2:
	if index < spawn_points.size():
		return spawn_points[index].global_position
	# Fallback positions
	return Vector2(-200 + index * 400, -100)
