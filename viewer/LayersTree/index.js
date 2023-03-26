import './app.css'
import App from './App.svelte'

const cont = document.getElementsByClassName('leftMenu')[0];
// const map = L.gmx.map;

const app = () => {
	new App({
	  target: cont,
	  props: {
		  // map,
		  cont
	  }
	});
}

export default app
