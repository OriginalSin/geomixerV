#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 prevHigh;
attribute vec2 currentHigh;
attribute vec2 nextHigh;

attribute vec2 prevLow;
attribute vec2 currentLow;
attribute vec2 nextLow;

attribute float order;
attribute float thickness;
attribute vec4 color;
uniform float thicknessOutline;
uniform vec2 viewport;
uniform vec4 extentParamsHigh;
uniform vec4 extentParamsLow;
varying vec4 vColor;

vec2 proj(vec2 coordHigh, vec2 coordLow) {
	vec2 highDiff = coordHigh - extentParamsHigh.xy;
	vec2 lowDiff = coordLow - extentParamsLow.xy;
	return vec2(-1.0 + (highDiff + lowDiff) * extentParamsHigh.zw) * vec2(1.0, -1.0);
}
// vec2 proj(vec2 coordinates){
	// return vec2(-1.0 + 2.0*(coordinates - extentParams.xy) * extentParams.zw);
	// return vec2(-1.0 + (coordinates - extentParamsHigh.xy) * extentParamsHigh.zw) * vec2(1.0, -1.0);
// }

void main(){
	vColor = color;

	// vec2 vNext = proj(nextHigh),
		 // vCurrent = proj(currentHigh),
		 // vPrev = proj(prevHigh);
	vec2 vNext = proj(nextHigh, nextLow),
		 vCurrent = proj(currentHigh, currentLow),
		 vPrev = proj(prevHigh, prevLow);

	vec2 _next = vNext;
	vec2 _prev = vPrev;
	vec2 _current = vCurrent;

	if(_prev == _current){
		if(_next == _current){
			_next = _current + vec2(1.0, 0.0);
			_prev = _current - _next;
		} else{
			_prev = _current + normalize(_current - _next);
		}
	}

	if(_next == _current){
		_next = _current + normalize(_current - _prev);
	}

	vec2 sNext = _next;
	vec2 sCurrent = _current;
	vec2 sPrev = _prev;
	
	vec2 dirNext = normalize(sNext - sCurrent);
	vec2 dirPrev = normalize(sPrev - sCurrent);
	float dotNP = dot(dirNext, dirPrev);
	
	vec2 normalNext = normalize(vec2(-dirNext.y, dirNext.x));
	vec2 normalPrev = normalize(vec2(dirPrev.y, -dirPrev.x));
	vec2 d = (thickness + thicknessOutline) * 0.5 * sign(order) / viewport;
	
	vec2 m;
	if(dotNP >= 0.99991){
		m = sCurrent - normalPrev * d;
	} else{
		vec2 dir = normalPrev + normalNext;
		m = sCurrent + dir * d / (dirNext.x * dir.y - dirNext.y * dir.x);
		
		if( dotNP > 0.5 && dot(dirNext + dirPrev, m - sCurrent) < 0.0 ){
			float occw = order * sign(dirNext.x * dirPrev.y - dirNext.y * dirPrev.x);
			if (occw == -1.0){
				m = sCurrent + normalPrev * d;
			} else if(occw == 1.0){
				m = sCurrent + normalNext * d;
			} else if(occw == -2.0){
				m = sCurrent + normalNext * d;
			} else if(occw == 2.0){
				m = sCurrent + normalPrev * d;
			}
		} else if(distance(sCurrent, m) > min(distance(sCurrent, sNext), distance(sCurrent, sPrev))){
			m = sCurrent + normalNext * d;
		}
	}
	gl_Position = vec4(m.x, m.y, 0.0, 1.0);
}