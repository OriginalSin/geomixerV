import {orient2d} from 'robust-predicates';
import TinyQueue from 'tinyqueue'
import SplayTree from 'splaytree'

// I don't think this is really a signed area function anymore...
// but I've kept it named from what it was...
function signedArea(p0, p1, p2) {

    // Docs from robust-predicate
    // Returns a positive value if the points p0, p1, and p2
    // occur in counterclockwise order
    // (p2 lies to the left of the directed line defined by points p0 and p1)
    return orient2d(p0.p.x, p0.p.y, p1.p.x, p1.p.y, p2.p.x, p2.p.y)
}

function areCoordsSame (p1, p2) {
    return Math.abs(p1 - p2) < Number.EPSILON
}

function checkWhichEventIsLeft (e1, e2) {
    if (e1.p.x > e2.p.x) return 1;
    if (e1.p.x < e2.p.x) return -1;

    if (e1.p.y !== e2.p.y) return e1.p.y > e2.p.y ? 1 : -1;
    return 1
}
function ringToEventQueue (eventQueue, ring, point) {
		let currentP = new Point(point || ring.shift());
		let nextP = null
		ring.forEach(p => {
			nextP = new Point(p)

			const e1 = new Event(currentP)
			const e2 = new Event(nextP)

			e1.otherEvent = e2;
			e2.otherEvent = e1;

			if (checkWhichEventIsLeft(e1, e2) > 0) {
				e2.isLeftEndpoint = true;
				e1.isLeftEndpoint = false
			} else {
				e1.isLeftEndpoint = true;
				e2.isLeftEndpoint = false
			}
			eventQueue.queue.push(e1)
			eventQueue.queue.push(e2)

			currentP = nextP
		});
}

class EventQueue {

    constructor () {
        this.queue = new TinyQueue([], checkWhichEventIsLeft);
    }

    checkIfQueueContainsEvent (e) {
        for (let i = 0; i < this.queue.data.length; i++) {
            if (this.queue.data[i].isSamePoint(e)) return true
        }
        return false
    }
}

class Event {

    constructor (p) {
        this.p = p

        this.otherEvent = null
        this.isLeftEndpoint = null
        this.segment = null
        this.segmentIndex = null
    }

    isSamePoint(eventToCheck) {
        return this.p.isSamePoint(eventToCheck.p)
    }

    isBelow (p) {
        return this.isLeftEndpoint ?
            signedArea(this, this.otherEvent, p) > 0 :
            signedArea(this.otherEvent, p, this) > 0
    }

    isAbove (p) {
        return !this.isBelow(p);
    }

}
class Point {

    constructor (coords) {
        this.x = coords[0]
        this.y = coords[1]
    }

    isSamePoint(pointToCheck) {
        return areCoordsSame(this.x, pointToCheck.x) && areCoordsSame(this.y, pointToCheck.y)
    }
}

function compareSegments(seg1, seg2) {
    if (seg1 === seg2) return 0

    if (signedArea(seg1.leftSweepEvent, seg1.rightSweepEvent, seg2.leftSweepEvent) !== 0 ||
        signedArea(seg1.leftSweepEvent, seg1.rightSweepEvent, seg2.rightSweepEvent) !== 0) {

        // If the segments share their left endpoints
        // use the right endpoint to sort
        if (seg1.leftSweepEvent.isSamePoint(seg2.leftSweepEvent)) return seg1.leftSweepEvent.isBelow(seg2.rightSweepEvent) ? -1 : 1;

        // If the segments have different left endpoints
        // use the left endpoint to sort
        if (seg1.leftSweepEvent.p.x === seg2.leftSweepEvent.p.x) return seg1.leftSweepEvent.p.y < seg2.leftSweepEvent.p.y  ? -1 : 1;

        // If the line segment associated to e1 been inserted
        // into S after the line segment associated to e2 ?
        if (checkWhichEventIsLeft(seg1.leftSweepEvent, seg2.leftSweepEvent) === 1) return seg2.leftSweepEvent.isAbove(seg1.leftSweepEvent) ? -1 : 1;

        // The line segment associated to e2 has been inserted
        // into S after the line segment associated to e1
        return seg1.leftSweepEvent.isBelow(seg2.leftSweepEvent) ? -1 : 1;
    }

    return checkWhichEventIsLeft(seg1.leftSweepEvent, seg2.leftSweepEvent) === 1 ? 1 : -1;

}

class Segment {

    constructor (event) {
        this.leftSweepEvent = event
        this.rightSweepEvent = event.otherEvent
        this.segmentAbove = null
        this.segmentBelow = null

        event.segment = this
        event.otherEvent.segment = this
    }
}

class SweepLine {
    constructor () {
        this.tree = new SplayTree(compareSegments)
    }

    addSegment (event) {
        const seg = new Segment(event)
        const node = this.tree.insert(seg)
        const nextNode = this.tree.next(node)
        const prevNode = this.tree.prev(node)
        if (nextNode !== null) {
            seg.segmentAbove = nextNode.key
            seg.segmentAbove.segmentBelow = seg
        }
        if (prevNode !== null) {
            seg.segmentBelow = prevNode.key
            seg.segmentBelow.segmentAbove = seg
        }
        return node.key
    }

    removeSegmentFromSweepline (seg) {
        const node = this.tree.find(seg)
        if (node === null) return
        const nextNode = this.tree.next(node)
        const prevNode = this.tree.prev(node)

        if (nextNode !== null) {
            const nextSeg = nextNode.key
            nextSeg.segmentBelow = seg.segmentBelow
        }
        if (prevNode !== null) {
            const prevSeg = prevNode.key
            prevSeg.segmentAbove = seg.segmentAbove
        }
        this.tree.remove(seg)
    }

    flipSegments (seg1, seg2) {
        const node1 = this.tree.find(seg1)
        const node2 = this.tree.find(seg2)

        if (node1 === null || node2 === null) {
            return
        }
        const tempAbove1 = seg1.segmentAbove
        const tempAbove2 = seg2.segmentAbove

        const tempBelow1 = seg1.segmentBelow
        const tempBelow2 = seg2.segmentBelow

        if (seg2.segmentAbove === seg1) {
            seg1.segmentAbove = seg2
            seg2.segmentAbove = tempAbove1
            seg1.segmentBelow = tempBelow2
            seg2.segmentBelow = seg1
            if (tempAbove1 !== null) tempAbove1.segmentBelow = seg2
            if (tempBelow2 !== null) tempBelow2.segmentAbove = seg1
        } else {
            seg1.segmentAbove = tempAbove2
            seg2.segmentAbove = seg1
            seg1.segmentBelow = seg2
            seg2.segmentBelow = tempBelow1
            if (tempAbove2 !== null) tempAbove2.segmentBelow = seg1
            if (tempBelow1 !== null) tempBelow1.segmentAbove = seg2
        }
        const tmp1 = node1.key
        const tmp2 = node2.key

        node2.key = tmp1
        node1.key = tmp2
    }

    testIntersect (seg1, seg2) {
        if (seg1 === null || seg2 === null) return false

        if (seg1.rightSweepEvent.isSamePoint(seg2.leftSweepEvent) ||
            seg1.rightSweepEvent.isSamePoint(seg2.rightSweepEvent) ||
            seg1.leftSweepEvent.isSamePoint(seg2.leftSweepEvent) ||
            seg1.leftSweepEvent.isSamePoint(seg2.rightSweepEvent)) return false

        const x1 = seg1.leftSweepEvent.p.x
        const y1 = seg1.leftSweepEvent.p.y
        const x2 = seg1.rightSweepEvent.p.x
        const y2 = seg1.rightSweepEvent.p.y
        const x3 = seg2.leftSweepEvent.p.x
        const y3 = seg2.leftSweepEvent.p.y
        const x4 = seg2.rightSweepEvent.p.x
        const y4 = seg2.rightSweepEvent.p.y


        const denom = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1))
        const numeA = ((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))
        const numeB = ((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))

        if (denom === 0) {
            if (numeA === 0 && numeB === 0) return false
            return false
        }

        const uA = numeA / denom
        const uB = numeB / denom

        if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
            const x = x1 + (uA * (x2 - x1))
            const y = y1 + (uA * (y2 - y1))

            const p = new Point([x, y])
            const intersectionEvent = new Event(p)

            if (seg2.segmentAbove === seg1) {
                intersectionEvent.segment1 = seg1
                intersectionEvent.segment2 = seg2
            } else if (seg1.segmentAbove === seg2) {
                intersectionEvent.segment1 = seg2
                intersectionEvent.segment2 = seg1
            }

            const comp = compareSegments(seg1, seg2)
            if (comp > 0) {
                intersectionEvent.segment1 = seg1
                intersectionEvent.segment2 = seg2
            } else {
                intersectionEvent.segment1 = seg2
                intersectionEvent.segment2 = seg1
            }

            return intersectionEvent
        }
        return false
    }
}

function getIntersectionPoints(eventQueue) {
	const intersectionPoints = [];
	const sweepLine = new SweepLine();

	let currentSegment = null;

	while (eventQueue.queue.length) {
		const event = eventQueue.queue.pop();

		if (event.isLeftEndpoint) {
		  currentSegment = sweepLine.addSegment(event);
		  const ipWithSegAbove = sweepLine.testIntersect(
			currentSegment,
			currentSegment.segmentAbove
		  );
		  if (ipWithSegAbove !== false) {
			eventQueue.queue.push(ipWithSegAbove);
		  }

		  const ipWithSegBelow = sweepLine.testIntersect(
			currentSegment,
			currentSegment.segmentBelow
		  );
		  if (ipWithSegBelow !== false) {
			eventQueue.queue.push(ipWithSegBelow);
		  }
		} else if (event.isLeftEndpoint === false) {
		  if (event.segment) {
			const ipWithSegBelow = sweepLine.testIntersect(
			  event.segment.segmentAbove,
			  event.segment.segmentBelow
			);
			if (ipWithSegBelow !== false) {
			  if (!eventQueue.checkIfQueueContainsEvent(ipWithSegBelow)) {
				eventQueue.queue.push(ipWithSegBelow);
			  }
			}
			sweepLine.removeSegmentFromSweepline(event.segment);
		  }
		} else {
		  if (notInIntersectionPoints(event)) intersectionPoints.push(event);

		  // This ought to be the top segment
		  const segE1 = event.segment1;
		  // This ought to be the bottom segment
		  const segE2 = event.segment2;

		  sweepLine.flipSegments(segE1, segE2);

		  const segAbove = segE2.segmentAbove;
		  const segBelow = segE1.segmentBelow;

		  const ipWithSegAbove = sweepLine.testIntersect(
			segE2,
			segAbove,
			eventQueue
		  );
		  if (ipWithSegAbove !== false) {
			if (
			  !eventQueue.checkIfQueueContainsEvent(ipWithSegAbove) &&
			  notInIntersectionPoints(ipWithSegAbove)
			) {
			  eventQueue.queue.push(ipWithSegAbove);
			}
		  }

		  const ipWithSegBelow = sweepLine.testIntersect(
			segE1,
			segBelow,
			eventQueue
		  );
		  if (ipWithSegBelow !== false) {
			if (
			  !eventQueue.checkIfQueueContainsEvent(ipWithSegBelow) &&
			  notInIntersectionPoints(ipWithSegBelow)
			) {
			  eventQueue.queue.push(ipWithSegBelow);
			}
		  }
		}
	}

	function notInIntersectionPoints(e) {
		for (let i = 0; i < intersectionPoints.length; i++) {
		  if (
			(intersectionPoints[i].segment1 === e.segment1 &&
			  intersectionPoints[i].segment2 === e.segment2) ||
			(intersectionPoints[i].segment2 === e.segment1 &&
			  intersectionPoints[i].segment1 === e.segment2)
		  ) {
			return false;
		  }
		}
		return true;
	}
	return intersectionPoints;
}

function chkGeoJson(geojson, eventQueue) {
	// geoJson: (geojson, eventQueue) => {
	const geom = geojson.type === 'Feature' ? geojson.geometry : geojson

	let coords = geom.coordinates
	if (!coords) return;
	if (geom.type === 'Polygon') coords = [coords]

	coords.forEach(arr => {
		arr.forEach(iArr => { ringToEventQueue(eventQueue, iArr); });
	});
}
function chkPoint(coord, ring, eventQueue) {
	
	ringToEventQueue(eventQueue, ring, coord);
}

export default {
	chkGeoJson: (geojson) => {
		const eventQueue = new EventQueue();
		chkGeoJson(geojson, eventQueue);
		return getIntersectionPoints(eventQueue);
	},
	isPointIntersectRing: (coord, ring) => {
		coord = [coord.x, coord.y];
		ring = ring.map(it => [it.x, it.y]);
		const eventQueue = new EventQueue();
		chkPoint(coord, ring, eventQueue);
		return getIntersectionPoints(eventQueue);
	}
}
