extends Camera2D
class_name CameraController

## Smooth-follow camera with screen shake, dynamic zoom, and arena bounds.

@export var follow_target: Node2D
@export var smoothing_speed: float = 6.0
@export var default_zoom: Vector2 = Vector2(1.6, 1.6)
@export var arena_bounds: Rect2 = Rect2(-1600, -900, 3200, 1800)

# Screen shake
var shake_intensity: float = 0.0
var shake_duration: float = 0.0
var shake_timer: float = 0.0


func _ready() -> void:
	make_current()
	zoom = default_zoom
	_find_target()


func _find_target() -> void:
	if not follow_target:
		follow_target = get_tree().get_first_node_in_group("players")


func _process(delta: float) -> void:
	if not follow_target:
		_find_target()

	# Follow target with smoothing
	if follow_target:
		var target_pos := follow_target.global_position

		# Camera bounds checking with zoom factor
		var vp_size := get_viewport_rect().size
		var half_w := (vp_size.x * 0.5) / zoom.x
		var half_h := (vp_size.y * 0.5) / zoom.y

		var min_x := arena_bounds.position.x + half_w
		var max_x := arena_bounds.end.x - half_w
		if min_x < max_x:
			target_pos.x = clampf(target_pos.x, min_x, max_x)

		var min_y := arena_bounds.position.y + half_h
		var max_y := arena_bounds.end.y - half_h
		if min_y < max_y:
			target_pos.y = clampf(target_pos.y, min_y, max_y)

		global_position = global_position.lerp(target_pos, smoothing_speed * delta)

	# Screen shake
	if shake_timer > 0.0:
		shake_timer -= delta
		var shake_amount := shake_intensity * (shake_timer / shake_duration)
		offset = Vector2(
			randf_range(-shake_amount, shake_amount),
			randf_range(-shake_amount, shake_amount)
		)
	else:
		offset = Vector2.ZERO


func shake(intensity: float, duration: float) -> void:
	shake_intensity = maxf(shake_intensity, intensity)
	shake_duration = duration
	shake_timer = duration
