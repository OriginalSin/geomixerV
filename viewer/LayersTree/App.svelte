<script>
	import LayersTree from './LayersTree.svelte';
  // import svelteLogo from './assets/svelte.svg'
  // import Counter from './lib/Counter.svelte'
  
	// export let map;
	export let cont;

	cont.parentNode.classList.add('leftMenuOn');
	let activeTab = 'layers-tree';
	if (activeTab) cont.classList.add('active');
	const setActive = ev => {
		const node = ev.target;
		const name = node.getAttribute('data-id');

		if (name === activeTab) {
			activeTab = '';
			cont.classList.remove('active');
		} else {
			activeTab = name;
			cont.classList.add('active');
		}
		// activeTab = activeTab === 'layers-tree' ? 'forestView' : 'layers-tree';
		
		
	}
</script>
<div class="iconSidebarControl">
	<ul class="tabs">
		<li class="tab {activeTab === 'layers-tree' ? 'active' : ''}" data-id="layers-tree" on:click={setActive}>
			<svg role="img" class="svgIcon"><use href="#s-tree" /></svg>
		</li>
		<li class="tab {activeTab === 'forestView' ? 'active' : ''}" data-id="forestView" on:click={setActive}>
			<svg role="img" class="svgIcon"><use href="#s-forest-plugin"></use></svg>
		</li>
	</ul>
	<div class="panes">
		<div data-id="layers-tree" class="pane layers-tree {activeTab === 'layers-tree' ? 'active' : ''}">
			<LayersTree />
		</div>
		<div data-id="forestView" class="pane forest {activeTab === 'forestView' ? 'active' : ''}">forestView
		</div>
	</div>
</div>

<style>
.iconSidebarControl {
	height: 100%;
	font-family: sans-serif;
    font-size: 12px;
    font-weight: 400;
}
.iconSidebarControl .panes div {
	display: none;
}
.iconSidebarControl .panes div.active {
	display: block;
}
.iconSidebarControl .panes {
    float: right;
	width: 362px;
}
.iconSidebarControl .tabs {
    width: 40px;
    height: 100%;
	margin: 0;
	padding-left: 0px;
    float: left;
    background-color: #4c5567;
}
.iconSidebarControl .tabs .tab.active {
	fill: #70cbe0;
	border-left-color: #70cbe0;
}
.iconSidebarControl .tabs .tab {
    height: 40px;
    text-align: center;
    cursor: pointer;
    user-select: none;
	fill: #d8e1e8;
	border-left: 4px solid transparent;
}
.iconSidebarControl .tabs .tab svg {
    width: 20px;
    height: 20px;
    margin-left: -4px;
    margin-top: 10px;
    left: -4px;
	pointer-events: none;
}
.iconSidebarControl  .panes .pane {
    border: 1px solid #DDD;
    /* padding: 10px 0px 10px 0px; */
    margin: 10px 5px;
}
</style>
