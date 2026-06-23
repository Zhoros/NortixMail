<script>
	import './globalStyle.css'
	import { onMount, onDestroy } from 'svelte';
	import { post, copyToClipboard } from './helper.js'
	let domainName = "";
	let addresses = [];
	let selectedAddress = null;

	let mails = [];
	let page = 1;
	let viewType = "mails";

	let mailDataSender;
	let mailDataSubject;

	let showDeleteModal = false;
	let mailIdToDelete = null;

	let intervalId;

	function refreshMails(){
		post('/mails', {addr: selectedAddress, page: page}, (data) => {
			mails = data;
		});
	}

	function selectedAddressChange(){
		page = 1;
		refreshMails();
		localStorage.setItem("address", selectedAddress);
	}

	function copyClicked(){
		copyToClipboard(selectedAddress + domainName);
	}

	function waitForElement(selector) {
		return new Promise((resolve) => {
			const observer = new MutationObserver((mutationsList, observer) => {
				for (let mutation of mutationsList) {
					if (mutation.type === 'childList' && document.querySelector(selector)) {
						observer.disconnect();
						resolve(document.querySelector(selector));
						return;
					}
				}
			});
			observer.observe(document.body, { childList: true, subtree: true });
		});
	}

	function mailClicked(event){
		if((event.type == 'keypress' && event.key == 'Enter') || (event.type == 'click' && event.button == 0)){
			let closest = event.target.closest(".clickable");
			post('/mailData', {id: closest.dataset.id}, (data) => {
				mailDataSender = data.sender;
				mailDataSubject = data.subject;
				viewType = 'mailData';

				waitForElement("#mailData").then((element)=>{
					const shadowRoot = element.attachShadow({ mode: 'open' });
					shadowRoot.innerHTML = data.content;
				})
			});
		}
	}

	function deleteClicked(event){
		if((event.type == 'keydown' && event.key == 'Enter') || (event.type == 'click' && event.button == 0)){
			mailIdToDelete = event.target.dataset.id;
			showDeleteModal = true;
		}
		event.stopPropagation();
	}

	function confirmDelete() {
		if (mailIdToDelete) {
			post('/deleteMail', {id: mailIdToDelete}, () => {
				refreshMails();
				closeModal();
			});
		}
	}

	function closeModal() {
		showDeleteModal = false;
		mailIdToDelete = null;
	}

	function backClicked(){
		mailDataSender = null;
		mailDataSubject = null;
		viewType = "mails"
	}

	function nextPage(){
		if(mails.length > 0){
			page += 1;
			refreshMails();
		}
	}

	function prevPage(){
		if(page > 1){
			page -= 1;
			refreshMails();
		}
	}

	onMount(() => {
		post('/addresses', {}, (data) => {
			addresses = data.addresses;
			if (data.addresses.length > 0){
				selectedAddress = addresses[data.addresses.length-1].addr;
				let lastSelectedAddress = localStorage.getItem("address");
				if (lastSelectedAddress !== null && addresses.some(address => address.addr == lastSelectedAddress)) {
					selectedAddress = lastSelectedAddress;
				}

				refreshMails();
				
				intervalId = setInterval(() => {
					refreshMails();
				}, data.refreshInterval * 1000);
			}
		});

		post('/domain', {}, (data) => {
			domainName = '@' + data;
		})
	});

	onDestroy(() => {
		if (intervalId) clearInterval(intervalId);
	});
</script>

<main class="h-screen overflow-auto bg-zinc-950 text-zinc-100 flex flex-col items-center p-2 antialiased">
	<div class="w-full max-w-2xl flex flex-col gap-3 my-auto">
		
		<div class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-2 shadow-lg">
			<div class="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
				<select 
					bind:value={selectedAddress} 
					on:change={selectedAddressChange} 
					class="bg-transparent text-zinc-100 font-medium text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 max-w-[65%] truncate cursor-pointer transition"
				>
					{#each addresses as address}
						<option value={address.addr} class="bg-zinc-900 text-zinc-100">{address.addr}</option>
					{/each}
				</select>
				<span class="text-zinc-400 font-medium text-sm sm:text-base truncate select-none">{domainName}</span>
			</div>
			<button 
				on:keypress={copyClicked} 
				on:click={copyClicked} 
				class="bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg border border-zinc-700 transition"
			>
				Copy
			</button>
		</div>

		<div id="mailList" class="w-full min-h-[400px] bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl p-4 flex flex-col">
			{#if viewType == 'mails'}
				{#if mails.length === 0}
					<div class="flex-1 flex flex-col items-center justify-center text-zinc-500 py-12">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 mb-2 opacity-60">
							<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
						</svg>
						<p class="text-sm font-medium">Inbox is empty</p>
					</div>
				{:else}
					<div class="flex flex-col divide-y divide-zinc-800">
						{#each mails as mail}
							<div 
								data-id={mail.id} 
								on:keypress={mailClicked} 
								on:click={mailClicked} 
								role="button" 
								tabindex="0" 
								class="clickable group flex items-center justify-between py-3.5 px-2 hover:bg-zinc-800/40 rounded-lg outline-none focus:bg-zinc-800/60 transition cursor-pointer"
							>
								<div class="flex flex-col min-w-0 pr-4">
									<span class="text-sm font-semibold text-zinc-200 group-hover:text-zinc-100 transition truncate">{mail.sender}</span>
									<span class="text-xs text-zinc-400 group-hover:text-zinc-300 transition truncate mt-0.5">{mail.subject}</span>
								</div>
								<button 
									data-id={mail.id}
									on:keydown={deleteClicked} 
									on:click={deleteClicked}
									type="button"
									aria-label="Delete mail"
									class="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition active:scale-95 flex-shrink-0"
								>
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-5 h-5 pointer-events-none">
										<path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
									</svg>
								</button>
							</div>
						{/each}
					</div>
				{/if}
			{/if}

			{#if viewType == 'mailData'}
				<div class="flex flex-col h-full flex-1">
					<div class="pb-3 border-b border-zinc-800">
						<span class="text-xs font-semibold uppercase tracking-wider text-indigo-400 block mb-0.5">From</span>
						<span class="text-sm font-medium text-zinc-200 block break-all">{mailDataSender}</span>
						<span class="text-xs font-semibold uppercase tracking-wider text-zinc-500 block mt-3 mb-0.5">Subject</span>
						<h1 class="text-base font-bold text-zinc-100">{mailDataSubject}</h1>
					</div>
					<div id="mailData" class="bg-white text-zinc-900 rounded-lg p-4 my-4 overflow-auto flex-1 min-h-[250px] shadow-inner border border-zinc-800"></div>
					<div class="mt-auto pt-2">
						<button on:click={backClicked} class="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold px-5 py-2 rounded-lg border border-zinc-700 active:scale-95 transition">
							Back to Inbox
						</button>
					</div>
				</div>
			{/if}
		</div>

		<div class="flex items-center justify-center gap-4">
			<button 
				on:click={prevPage}
				disabled={page <= 1}
				class="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-900 text-zinc-200 p-2.5 rounded-xl border border-zinc-800 active:scale-95 transition shadow"
			>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
				</svg>
			</button>
			<span class="text-sm font-bold text-zinc-400 select-none bg-zinc-900/50 px-4 py-1.5 border border-zinc-850 rounded-full shadow-inner">
				Page {page}
			</span>
			<button 
				on:click={nextPage}
				disabled={mails.length === 0}
				class="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-900 text-zinc-200 p-2.5 rounded-xl border border-zinc-800 active:scale-95 transition shadow"
			>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
					<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
				</svg>
			</button>
		</div>

		<button 
			on:click={()=>{window.location.replace('/manage.html')}} 
			class="w-full bg-zinc-900 hover:bg-zinc-850 hover:border-indigo-500/50 hover:text-indigo-400 active:scale-[0.99] text-zinc-300 text-sm font-semibold py-3 px-4 rounded-xl border border-zinc-800 shadow-lg transition-all duration-200"
		>
			Manage addresses
	</button>
	</div>

	{#if showDeleteModal}
		<div class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
			<div role="dialog" aria-modal="true" class="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
				<h3 class="text-lg font-bold text-zinc-100">Delete Message</h3>
				<p class="text-sm text-zinc-400 mt-2">Are you sure you want to delete this email? This action cannot be undone.</p>
				
				<div class="flex items-center justify-end gap-3 mt-6">
					<button 
						on:click={closeModal}
						class="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold px-4 py-2 rounded-lg border border-zinc-700 transition"
					>
						Cancel
					</button>
					<button 
						on:click={confirmDelete}
						class="bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-lg shadow-red-600/20"
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	{/if}
</main>
