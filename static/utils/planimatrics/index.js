export function getLineIntersection([[p0_x, p0_y], [p1_x, p1_y]], [[p2_x, p2_y], [p3_x, p3_y]]) {
	const s1_x = p1_x - p0_x;
	const s1_y = p1_y - p0_y;
	const s2_x = p3_x - p2_x;
	const s2_y = p3_y - p2_y;

	const s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
	const t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

	if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
		return [p0_x + (t * s1_x), p0_y + (t * s1_y)];
	}
	return null;
}
