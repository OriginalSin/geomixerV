<script>
    import { onMount, onDestroy, beforeUpdate, afterUpdate, createEventDispatcher } from 'svelte';
	import Group from './Group.svelte'
	import DateRange from '../DateRange/DateRange.svelte'
	import { _layerTree } from '../stores.js';
import './LayersTree.css'

	// export let map;

	const day = 24*3600*1000;

	let now = new Date();
	// var begin = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
	var begin = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
	let end = begin.valueOf() + day - 1;
	let dateInterval = { begin, end };
	let gmxMap = L.gmxMapProps || L.gmx.gmxMap;
console.log('gmxMap', gmxMap);
	let layersCont;
	let props = gmxMap.properties || {};
	let rawTree = gmxMap.rawTree;
	let childs = [];
	// let childs = rawTree.children;
	_layerTree.subscribe(value => {rawTree = value; childs = rawTree.children});
	
    onMount(() => {
		_layerTree.set(L.gmxMapProps.rawTree);
		// console.log('onMount', L.gmx.gmxMap.rawTree);
		// console.log('onMount childs', childs);
		
		// if (!rawTree) getGmxMap();
	});
	const refresh = ev => {
		const tree = ev.detail.tree;
		console.log('refresh', tree);
		// refresh
		_layerTree.set(tree);
		// childs = tree.children.slice();
	}

</script>
<div class="map">
	<div class="mainmap-title">{props.title}</div>
	<div class="leftPanelCont scrollbar">
		<div class="layers-before">
			<DateRange {dateInterval} />
		</div>

		<div class="layers" bind:this={layersCont} >
			<Group {childs} {layersCont} on:refresh={refresh} />
		</div>
	</div>
</div>


<style>

.map {
    text-align: left;
    height: calc(100vh - 0px);
}

.map .mainmap-title {
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    overflow-x: hidden;
    /* width: 320px; */
    text-overflow: ellipsis;
	padding: 7px 8px 7px 8px;

}
.leftPanelCont {
    overflow-y: auto;
    height: calc(100% - 42px);
}
.layers-before,
.layers {
	border: 1px solid #DDD;
    /* padding: 10px 0px 10px 0px; */
    margin: 10px 5px;
}
.layers {
    height: 100%;
    font-family: sans-serif;
    font-size: 12px;
    font-weight: 400;
}
</style>
