<script>
    // import './DateRange.css';
    // import { imask } from '@imask/svelte';
    // import Calendar from '../Calendar/Calendar.svelte';
    import { onMount, createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    export let dateInterval = {};
    export let value = '';
    // export let position = 'bottom';
    export let exchange = false;
    export let className = '';
	
    $: exchange && (value = exchange) && dispatch('notify', value);

	const day = 24*3600*1000;
	// let begin = (dateInterval.begin || new Date()).toLocaleDateString();
	let begin = new Date(dateInterval.begin).toISOString().slice(0, 10);
	let end = new Date(dateInterval.end).toISOString().slice(0, 10);
	let gmxMap = L.gmxMapProps || L.gmx.gmxMap;

    let open = false,
        mouseMove = false,
		timeIcon = L.gmxUtil.setSVGIcon('time'),
		warns = {},
		btime = '00',
		etime = '24',
        placeholder = 'День / Месяц / Год',
        svgCalendar,
        input;

	const check = () => {
        warns = {...warns,
            begin: dateInterval.begin > dateInterval.end,
            end: dateInterval.begin > dateInterval.end
        };
        // console.log('check', warns)
	};
    $: dateInterval && (
		begin = new Date(dateInterval.begin).toISOString().slice(0, 10),
		end = new Date(dateInterval.end).toISOString().slice(0, 10)
	) && check();

    // const month = ['Январь' , 'Февраль' , 'Март' , 'Апрель' , 'Май' , 'Июнь' , 'Июль' , 'Август' , 'Сентябрь' , 'Октябрь' , 'Ноябрь' , 'Декабрь'];
    // const option = {
        // mask: Date,
        // pattern: 'd . `m . `Y',
        // format(date) {
            // let day = date.getDate();
            // let month = date.getMonth() + 1;
            // const year = date.getFullYear();
            // if (day < 10) { day = '0' + day; }
            // if (month < 10) { month = '0' + month; }
            // return [day, month, year].join(' . ');
        // },
        // parse(str) {
            // const dayMonthYear = str.split(' . ');
            // return new Date(dayMonthYear[2], dayMonthYear[1] - 1, dayMonthYear[0]);
        // },
        // min: new Date(1900, 0, 1),
        // max: new Date(2999, 12, 31),
        // overwrite: true
    // };

    onMount(() => {
        // svgCalendar.addEventListener('mouseover', () => mouseMove = true);
        // svgCalendar.addEventListener('mouseout', () => mouseMove = false);
		// gmxMap.setDateIntervals({
			// begin: dateInterval.begin / 1000,
			// end: dateInterval.end / 1000
		// });
    });

    function close(e) {
        open = false;
        input.focus();
        dispatch('notify', e.detail)
    }

    function change(e) {
		const target = e.target;
		let val = target.value;
		if (val && target.classList.contains('date')) {
			val = new Date(val).valueOf();
			if (val < 0) return;
			if (target.classList.contains('begin')) {
				dateInterval.begin = val;
			} else if (target.classList.contains('end')) {
				dateInterval.end = val;
			}
		} else if (target.classList.contains('btime')) {
			btime = (Array(2).join('0') + val).slice(-2);
		} else if (target.classList.contains('etime')) {
			etime = (Array(2).join('0') + val).slice(-2);
		} else if (target.classList.contains('left')) {
			dateInterval.begin -= day;
			dateInterval.end -= day;
		} else if (target.classList.contains('right')) {
			dateInterval.begin += day;
			dateInterval.end += day;
		}
		gmxMap.setDateIntervals({
			begin: dateInterval.begin / 1000,
			end: dateInterval.end / 1000
		});
        console.log('change', dateInterval)
    }

    // document.addEventListener('click', e => {
        // const dateRanges = document.querySelectorAll('.date-range-container > .calendar.active');
        // dateRanges?.forEach(el => {
            // if (!e.target.closest('.date-range-container')) {
                // const click_ev = document.createEvent('MouseEvents');
                // click_ev.initEvent('click', true, true);
                // el.dispatchEvent(click_ev);
            // }
        // });
    // });
// const optHours = (Array(25).join().split(',').map((it, i) => '<option value="' + (Array(2).join("0") + i).slice(-2) + '"></option>')).join('');
</script>

<div class='date-range-container {className} {open ? 'active' : ''}'>
	<span on:click={change} class="icon date left"></span>
    <input value={begin} max={end} on:change={change} class="begin date {warns?.begin ? 'warn' : ''} {mouseMove ? 'active' : ''}" type='date' placeholder />
    <input value={end} min={begin} on:change={change} class="end date {warns?.end ? 'warn' : ''} {mouseMove ? 'active' : ''}" type='date' placeholder />
	<span on:click={change} class="icon date right"></span>
	<span class="time">
		{@html timeIcon}
		<input value="{btime}" on:change={change} class="btime" type="number" min=0 max=24 />
		<span>-</span>
		<input value="{etime}" on:change={change} class="etime" type="number" min=0 max=24 />
	</span>
	<div class="sync-type">
		<span class="itypeTxt"><input on:change={change} class="itype" type="checkbox" checked=true />Единый интервал для слоев</span>
		<span class="dailyTxt"><input on:change={change} class="daily" type="checkbox" checked=true />посуточно</span>
	</div>
</div>
<style>
.date-range-container {
    position: relative;
    /* width: 178px; */
    /* height: 40px; */
    /* background-color: #FFFFFF; */
    z-index: 9;
    /* text-align: center; */
    padding: 4px 0px 4px;
	user-select: none;
}
.date-range-container input[type="date"]:focus,
.date-range-container input[type="date"] {
	font-family: unset;
    border: unset;
	outline: none;
    width: 96px;
	opacity: 0.7;
}

.date-range-container .icon.left:before { content: '<'; }
.date-range-container .icon.right:before { content: '>'; }

.date-range-container [class*="icon"]:before {
    /* font-family: "fontello"; */
    display: inline-block;
    width: 1em;
	font-weight: bold;
    margin: 0.2em 0.2em;
    text-align: center;
	cursor: pointer;
}
/*
    input[type="date"]:after {
        content: "\25BC"; 
        color: #555;
        padding: 0 5px;
    }
*/
    /* change color of symbol on hover
	    input[type="date"]:hover:after {

	*/
.date-range-container input[type="date"]::-webkit-calendar-picker-indicator {
	cursor: pointer;
}
.date-range-container input[type="date"]:hover {
	font-weight: bold;
	opacity: 1;
	/* color: #bf1400; */
}
.date-range-container .time {
    margin-left: 4px;
}

.date-range-container .time input {
    width: 16px;
}
/* Chrome, Safari, Edge, Opera */
.date-range-container .time input::-webkit-outer-spin-button,
.date-range-container .time input::-webkit-inner-spin-button {
	-webkit-appearance: none;
	margin: 0;
}

/* Firefox */
.date-range-container .time input[type=number] {
	-moz-appearance: textfield;
}
.date-range-container .sync-type span {
    /* display: flex; */
}
.date-range-container .sync-type span.itypeTxt {
    /* left: -22px; */
}
.date-range-container .sync-type span.dailyTxt {
    position: relative;
    right: -64px;
}
.date-range-container svg.time {
    height: 16px;
    width: 16px;
	vertical-align: -3px;
}

    /* make the native arrow invisible and stretch it over the whole field so you can click anywhere in the input field to trigger the native datepicker
    input[type="date"]::-webkit-calendar-picker-indicator {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: auto;
        height: auto;
        color: transparent;
        background: transparent;
    }
	*/
/*

@font-face {
  font-family: 'fontello';
  src: url("../img/font/fontello.eot?7277779");
  src: url("../img/font/fontello.eot?7277779#iefix") format('embedded-opentype'),
       url("../img/font/fontello.woff?7277779") format('woff'),
       url("../img/font/fontello.ttf?7277779") format('truetype'),
       url("../img/font/fontello.svg?7277779#fontello") format('svg');
  font-weight: normal;
  font-style: normal;
}

.date-range-container.active {
    z-index: 100;
}
.date-range-container > input.date-range {
    position: absolute;
    padding: 0px 10px;
    width: 180px;
    height: 40px;
    box-sizing: border-box;
    background-color: rgba(0, 0, 0, 0);
    border: 1px solid #E3E8F1;
    border-radius: 6px;
    z-index: 10;
}
.date-range-container > input.date-range.active {
    border: 1px solid #226B4B;
}
.date-range-container > input.date-range:hover,
.date-range-container > input.date-range:focus {
    outline: none !important;
    border: 1px solid #226B4B;
}
.date-range-container > input::placeholder {
    font: 13px MontserratRegular;
    color: #686B84;
}
.date-range-container > svg.calendar {
    position: absolute;
    right: 10px;
    top: 11px;
    z-index: 10;
    cursor: pointer;
}
.date-range-container > .calendar-form {
    position: relative;
    width: 276px;
    height: 305px;
    background-color: #FFFFFF;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.25);
    border-radius: 6px;
}
.calendar-form.position-bottom {
    top: 50px;
}
.calendar-form.position-top {
    top: -310px;
} 
.date-range-container > .calendar-form.hidden {
    display: none;
}
.date-range-container > .calendar-form > .calendar-bar {
    display: flex;
    justify-content: center;
    align-items: center;
    padding-top: 10px;
}
.date-range-container > .calendar-form > .calendar-bar > .current-month {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 6px;
    width: 106px;
    height: 31px;
    font: 12px MontserratRegular;
    color: #3B3F61;
    background-color: rgba(245, 246, 246, .6);
}
.date-range-container > .calendar-form > .calendar-bar > .prev,
.date-range-container > .calendar-form > .calendar-bar > .next {
    position: relative;
    width: 15px;
    height: 15px;
    background-color: #FFFFFF;
    border: none;
}
.date-range-container > .calendar-form > .calendar > .weekdays-name {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px 0;
}
.date-range-container > .calendar-form > .calendar > .weekdays-name > .days-name {
    padding: 0 9px;
    width: 18px;
    height: 12px;
    font: 11px MontserratMedium;
    color: #686B84;
}
.date-range-container > .calendar-form > .calendar > .calendar-days {  
    display: flex;
    flex-wrap: wrap;
    padding: 0 12px;
}
.date-range-container > .calendar-form > .calendar > .calendar-days > * {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 22px;
    height: 22px;
    margin: 2.5px 6px;
    padding: 1px;
    font: 12px MontserratRegular;
    color: #3B3F61;
}
.date-range-container > .calendar-form > .calendar > .calendar-days > .month-day:hover,
.date-range-container > .calendar-form > .calendar > .calendar-days > .current-day:hover,
.date-range-container > .calendar-form > .calendar > .calendar-days > .current-day {
    color: #FFFFFF;
    background-color: #226B4B;
    border-radius: 3px;
    cursor: pointer;
}
.date-range-container > .calendar-form > .calendar > .calendar-days > .padding-day {
    color: #E3E8F1;
}
.date-range-container > .calendar-form > .calendar > .calendar-days > .current-day:hover {
    outline: none;
}
.date-range-container > .calendar-form > .calendar > .calendar-days > .padding-day:hover {
    cursor: default;
}
.date-range-container > .calendar-form > .calendar > .years-name {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px 0;
}
.date-range-container > .calendar-form > .calendar > .years-name > button {
    width: 80px;
    height: 35px;
    font: 13px MontserratMedium;
    background-color: #FFFFFF;
    border: 1.5px solid #226B4B;
    border-radius: 12px;
    transition: .3s;
    cursor: pointer;
}
.date-range-container > .calendar-form > .calendar > .years-name > button:hover {
    color: #FFFFFF;
    background-color: #226B4B;
    transition: .3s;
}
.date-range-container > .calendar-form > .calendar-bar > .prev > svg,
.date-range-container > .calendar-form > .calendar-bar > .next > svg {
    position: absolute;
    top: -3px;
    left: -4px;
    cursor: pointer;
	fill: #686B84;
}
.date-range-container > .calendar-form > .calendar-bar > .prev > svg {
    transform: rotate(180deg);
}
.date-range-container > svg.calendar:hover {
    fill: #226B4B;
}
.date-range-container > .calendar.active {
    fill: #226B4B;
}
*/

</style>
