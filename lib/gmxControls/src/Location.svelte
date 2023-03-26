<script>
    import { onMount, onDestroy, beforeUpdate, afterUpdate, createEventDispatcher } from 'svelte';
  
	export let options;

	let map = L.gmx.map || L.gmx.leafletMap;
	const Utils = L.gmxUtil;
			// console.log("options", options);

const _mzoom = [
    'M 1:500 000 000',  //  0   156543.03392804
    'M 1:300 000 000',  //  1   78271.51696402
    'M 1:150 000 000',  //  2   39135.75848201
    'M 1:80 000 000',   //  3   19567.879241005
    'M 1:40 000 000',   //  4   9783.9396205025
    'M 1:20 000 000',   //  5   4891.96981025125
    'M 1:10 000 000',   //  6   2445.98490512563
    'M 1:5 000 000',    //  7   1222.99245256281
    'M 1:2500 000',     //  8   611.496226281406
    'M 1:1 000 000',    //  9   305.748113140703
    'M 1:500 000',      //  10  152.874056570352
    'M 1:300 000',      //  11  76.437028285176
    'M 1:150 000',      //  12  38.218514142588
    'M 1:80 000',       //  13  19.109257071294
    'M 1:40 000',       //  14  9.554628535647
    'M 1:20 000',       //  15  4.777314267823
    'M 1:10 000',       //  16  2.388657133912
    'M 1:5 000',        //  17  1.194328566956
    'M 1:2 500',        //  18  0.597164283478
    'M 1:1 250',        //  19  0.298582141739
    'M 1:625'           //  20  0.149291070869
];
const coordFormats = [ '', '', ' (EPSG:3395)', ' (EPSG:3857)'];

let _scaleBarText = '', _scaleBarWidth = '';
let coordFormat = options.coordinatesFormat || 0,
	prevCoordinates = '', _redrawTimer, _window, _windowCoordinates = '', _windowInput, _windowContent = '', _windowText = '';
let _content, coordFormatChange, scaleBar, scaleBarTxt, locationTxt;

const getScaleBarDistance = (z, pos) => {
	const merc = L.Projection.Mercator,
		mPos = merc.project(pos),
		pos1 = merc.unproject(new L.Point(mPos.x + 40, mPos.y + 30)),
		mPixel = Math.pow(2, -z) * 156543.033928041 * pos1.distanceTo(pos) / 50;

	for (let i = 0; i < 30; i++) {
		let distance = [1, 2, 5][i % 3] * Math.pow(10, Math.floor(i / 3)),
			w = Math.floor(distance / mPixel);
		if (w > 50) {
			return {txt: Utils.prettifyDistance(distance), width: w};
		}
	}
	return null;
};

const _checkPositionChanged = () => {
	const z = map.getZoom();

	if (z && !map._animatingZoom) {
		let attr = {txt: _mzoom[z], width: 0};
		if (options.scaleFormat === 'bar') attr = getScaleBarDistance(z, map.getCenter());

		if (!attr || (attr.txt === _scaleBarText && attr.width === _scaleBarWidth)) return;
		_scaleBarText = attr.txt;
		_scaleBarWidth = attr.width;
		_setCoordinatesFormat(coordFormat);
	}
}
const _toggleHandlers = (flag) => {
	var op = flag ? 'on' : 'off',
		func = L.DomEvent[op];
	map[op]('moveend', _checkPositionChanged, this);
	map[op]('move', _setCoordinatesFormatEvent, this);
};
const setCoordinatesFormat = (num) => {
	num = num || coordFormat || 0;
	const len = coordFormats.length;
	coordFormat = options.coordinatesFormat = num < 0 ? len - 1 : (num >= len ? 0 : num);
	prevCoordinates = Utils.getCoordinatesString(map.getCenter(), coordFormat);
};
const goTo = (ev) => {
	console.log(ev);
	const coord = Utils.parseCoordinates(ev.target.previousSibling.value);
	map.panTo(coord);
};
const showCoordinates = (ev) => {        //окошко с координатами
	const oldText = Utils.getCoordinatesString(map.getCenter(), coordFormat);
	if (options.onCoordinatesClick) {
		options.onCoordinatesClick(oldText, ev);
	} else if (L.control.gmxPopup) {
		if (_windowContent) _windowContent = '';
		else {
			_windowText = L.gmxLocale.getText('gmxLocation.locationChange') || '';
			_windowContent = oldText;
			_windowCoordinates = prevCoordinates;
		}
	} else {
		//if (this.coordFormat > 2) { return; } // только для стандартных форматов.
		var text = window.prompt(locationTxt.title + ':', oldText);
		if (text && text !== oldText) {
			var point = Utils.parseCoordinates(text);
			if (point) { map.panTo(point); }
		}
	}
};
const nextCoordinatesFormat = () => {
	coordFormat += 1;
	_setCoordinatesFormat(coordFormat);
};

const _setCoordinatesFormatEvent = () => {
	_setCoordinatesFormat(coordFormat);
};

const _setCoordinatesFormat = (nm) => {
	if (!map._animatingZoom) {
		if (nm === 0) coordFormat = 0;
		setCoordinatesFormat(nm);
	}
};
const setScaleFormat = (type) => {
	options.scaleFormat = type === 'bar' ? 'bar' : 'text';
	_checkPositionChanged();
};

const toggleScaleFormat = () => {
	setScaleFormat(options.scaleFormat === 'bar' ? 'text' : 'bar');
};

onMount(() => {
	_toggleHandlers(true);
	L.DomEvent.disableClickPropagation(_content);
	_checkPositionChanged();
});

onDestroy(() => {
	_toggleHandlers(false);
});

// beforeUpdate(() => {
			// console.log("beforeUpdate", options);
// });

</script>
<div class="location" bind:this={_content}>
	{#if _windowContent}
	<div class="window" bind:this={_window}>
 		<button class='closeIcon' on:click={() => {_windowContent = ''}} />
		<div class="windowContent">
			<div class="gmxLocation-popup">
				<div class="text">{_windowText}</div><input bind:this={_windowInput} class="gmxLocation-input" value={_windowCoordinates} /><button on:click={goTo}>Ok</button>
			</div>
		</div>
	</div>
	{/if}
	<button bind:this={locationTxt} on:click={showCoordinates} class="locationTxt" title="Текущие координаты центра карты">{prevCoordinates}</button>
	<button bind:this={coordFormatChange} on:click={nextCoordinatesFormat} class="coordFormatChange" title="Сменить формат координат" />
	{#if _scaleBarWidth !== 0}
	<button bind:this={scaleBar} on:click={toggleScaleFormat} class="scaleBar acive" style="width: {_scaleBarWidth}px;" title="Сменить формат масштаба" />
	{/if}
	<button bind:this={scaleBarTxt} on:click={toggleScaleFormat} class="scaleBarTxt" title="Сменить формат масштаба">{_scaleBarText}</button>
</div>


<style>
.location {
	font-size: 11px;

}
.location button {
	background-color: transparent;
    border-radius: unset;
    border: unset;
	outline: none;
    padding: 0;
    font-size: 9pt;
    font-family: Tahoma;
    cursor: pointer;
}
.location .scaleBar {
    background-color: white;
    border: 1px solid black;
    bottom: 2px;
    position: relative;
    height: 6px;
    width: 40px;
}
.location .coordFormatChange {
    background-image: url(/img/coords.png);
    width: 10px;
    height: 9px;
	margin-right: 3px;
}
.location .locationTxt {
    color: black;
    font-size: 9pt;
    font-family: Tahoma;
    margin-right: 5px;
}
.location .window {
    box-shadow: rgba(100, 100, 100, 0.7) 0px 0px 3px;
    border: none;
    margin: 3px 0px 3px 3px;
    background-color: #FFFFFF;
    border-radius: 4px;
    padding: 10px;
    width: 260px;
    position: absolute;
    right: 0px;
    bottom: 20px;
}
.location .window .closeIcon {
    position: absolute;
    right: -2px;
    top: -4px;
    width: 16px;
    height: 16px;
    opacity: 0.5;
}
.location .window .closeIcon:before, .location .window .closeIcon:after {
    position: absolute;
	left: 0px;
    content: ' ';
    height: 14px;
    width: 2px;
    background-color: #333;
}
.location .window .closeIcon:before { transform: rotate(45deg); }
.location .window .closeIcon:after { transform: rotate(-45deg); }
.location .window button {
    border: 1px solid #d3d3d3;
    background: #e6e6e6;
    color: #555555;
    border-radius: 2px;
    padding: 2px 6px;
    margin-left: 4px;
}
.location .window button:hover {
    background: #d3d3d3;
}
.location .window .text {
    font-size: 12px;
}

</style>
