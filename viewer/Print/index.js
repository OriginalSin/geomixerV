import './Print.css'
import Print from './Print.svelte'
import { tick } from 'svelte';

const app = () => {
	const cont = document.getElementsByClassName('all')[0];
	const map = L.gmx.map;

	const print = new Print({
	  target: cont,
	  props: {
		  // map,
		  // cont
	  }
	});
	print.$on('visible', async ev => {
		document.body.classList.remove('printMap');
		const mapCont = map.getContainer();
		mapCont.style.width = mapCont.style.height = '';
		await tick();
		map.invalidateSize();
	});
}
export default app
