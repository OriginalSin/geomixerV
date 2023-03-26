<script>
    import { beforeUpdate, createEventDispatcher } from 'svelte';

    export let visible = false;

    const dispatch = createEventDispatcher();
    const map = L.gmx.map;

	const mapCont = map.getContainer();
	const BIG = 1150, SMALL = BIG / 1.4142;
	const layout = {
		width: SMALL + 'px',
		height: BIG + 'px'
	};

    function close(ev) {
		visible = false;
		setType();
		dispatch('visible', { visible });
    }
    function print(ev) {
		window.print();
    }
    function typeSel(ev) {
		setType(ev.target.value);
    }
    function setType(type) {
		// console.log('typeSel', type);
		let width = '', height = '';
		if (type === 'layout') {
			width = BIG + 'px', height = SMALL + 'px';
		} else if (type === 'portrait') {
			width = SMALL + 'px', height = BIG + 'px';
		}
		mapCont.style.width = width;
		mapCont.style.height = height;
		map.invalidateSize();
	}
	beforeUpdate(() => {
		setType(visible ? 'portrait' : '');
	});

</script>

<div class="print-ui {visible ? '' : 'disabled'}">
	<span class="print-ui-inner">
		<button on:click|preventDefault|stopPropagation ={close}>Закрыть</button>
		<button on:click={print} class="print">Печать</button>
		<span class="layoutContainer">
			<label>
				<input on:click={typeSel} type="radio" name="layout" value="portrait">портретная
			</label>
			<label>
				<input on:click={typeSel} type="radio" name="layout" value="layout">альбомная
			</label>
		</span>
	</span>
</div>

<style>
.print-ui.disabled {
	display: none;
}
.print-ui {
    position: absolute;
    top: 18px;
    left: 0px;
    right: 0px;
    text-align: center;
    user-select: none;
	z-index: 401;
}
.print-ui-inner {
    background: rgba(255, 255, 255, 0.9);
    padding: 15px;
}
</style>
