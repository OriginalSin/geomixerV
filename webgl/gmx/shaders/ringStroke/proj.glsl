vec2 proj(vec2 coordHigh, vec2 coordLow) {
	vec2 highDiff = coordHigh - extentParamsHigh.xy;
	vec2 lowDiff = coordLow - extentParamsLow.xy;
	return vec2(-1.0 + (highDiff + lowDiff) * extentParamsHigh.zw) * vec2(1.0, -1.0);
}
