<script>
	import './globalStyle.css'
	import { onMount } from 'svelte';
	import { post } from './helper.js';

	let hostName = $state('@' + window.location.host);
	let addresses = $state([]);
	let selectedAddress = $state(null);
	let newAddressText = $state("");

	let dialogType = $state(null);
	let dialogMessage = $state("");
	let onDialogConfirm = $state(() => {});

	function triggerAlert(msg) {
		dialogMessage = msg;
		dialogType = 'alert';
	}

	function triggerConfirm(msg, callback) {
		dialogMessage = msg;
		onDialogConfirm = () => callback(true);
		dialogType = 'confirm';
	}

	function closeDialog() {
		dialogType = null;
		dialogMessage = "";
		onDialogConfirm = () => {};
	}

	function refreshAddress() {
		post('/addresses', {}, (data) => {
			addresses = data.addresses;
			if (data.addresses.length > 0) {
				selectedAddress = data.addresses[data.addresses.length - 1].addr;
			}
		});
	}

	function addAddress() {
		const regex = /^(?!\.)(?!.*\.\.)(?!.*\.$)[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]{1,64}$/;
		if (regex.test(newAddressText)) {
			post('/addAddress', { address: newAddressText }, (data) => {
				if (data === "exist") {
					triggerAlert("Address already exists.");
				}
				if (data === "done") {
					newAddressText = "";
					refreshAddress();
				}
			});
		} else {
			triggerAlert("Invalid email address pattern.");
		}
	}

	function deleteAddress() {
		triggerConfirm("Delete this address?", (confirmed) => {
			if (confirmed) {
				post('./deleteAddress', { address: selectedAddress }, (data) => {
					if (data === "done") {
						refreshAddress();
						closeDialog();
					}
				});
			}
		});
	}

	function deleteEmails() {
		triggerConfirm("Delete all emails from this address?", (confirmed) => {
			if (confirmed) {
				post('./deleteEmails', { address: selectedAddress }, (data) => {
					if (data === "done") {
						closeDialog();
						setTimeout(() => triggerAlert("Done"), 100);
					}
				});
			}
		});
	}

	onMount(() => {
		refreshAddress();
	});
</script>

<main class="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center pt-8 sm:pt-16 px-4 pb-8 antialiased relative">
	<div class="w-full max-w-xl flex flex-col gap-6">
		
		<div class="w-fullgbg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col gap-3">
			<h2 class="text-sm font-bold text-indigo-400 uppercase tracking-wider">New Address</h2>
			
			<div class="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 focus-within:ring-1 focus-within:ring-indigo-500 transition">
				<input 
					bind:value={newAddressText} 
					placeholder="username" 
					type="text"
					class="bg-transparent text-zinc-100 placeholder-zinc-500 font-medium text-sm focus:outline-none flex-1 min-w-0"
				/>
				<span class="text-zinc-400 font-medium text-sm select-none shrink-0">{hostName}</span>
			</div>
			
			<button 
				on:click={addAddress} 
				class="w-full bg-zinc-800 hover:bg-indigo-950/30 hover:text-indigo-400 hover:border-indigo-900/50 text-zinc-200 text-xs font-semibold py-2.5 px-3 rounded-lg border border-zinc-700 active:scale-95 transition"
			>
				Add this address
			</button>
		</div>

		<div class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col gap-3">
			<h2 class="text-sm font-bold text-zinc-400 uppercase tracking-wider">Manage Addresses</h2>
			
			<div class="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 transition">
				<select 
					bind:value={selectedAddress} 
					class="bg-transparent text-zinc-100 font-medium text-sm focus:outline-none flex-1 min-w-0 cursor-pointer"
				>
					{#if addresses.length === 0}
						<option class="bg-zinc-900 text-zinc-500" disabled selected>No active aliases</option>
					{/if}
					{#each addresses as address}
						<option value={address.addr} class="bg-zinc-900 text-zinc-100">{address.addr}</option>
					{/each}
				</select>
				<span class="text-zinc-500 font-medium text-sm select-none shrink-0">{hostName}</span>
			</div>

			<div class="flex flex-col sm:flex-row gap-2 mt-1">
				<button 
					disabled={addresses.length === 0} 
					on:click={deleteAddress} 
					class="flex-1 bg-zinc-800 hover:bg-red-950/40 hover:text-red-400 hover:border-red-900/50 disabled:opacity-40 disabled:hover:bg-zinc-800 disabled:hover:text-zinc-200 text-zinc-200 text-xs font-semibold py-2 px-3 rounded-lg border border-zinc-700 active:scale-95 transition"
				>
					Delete address
				</button>
				<button 
					disabled={addresses.length === 0} 
					on:click={deleteEmails} 
					class="flex-1 bg-zinc-800 hover:bg-red-950/40 hover:text-red-400 hover:border-red-900/50 disabled:opacity-40 disabled:hover:bg-zinc-800 disabled:hover:text-zinc-200 text-zinc-200 text-xs font-semibold py-2 px-3 rounded-lg border border-zinc-700 active:scale-95 transition"
				>
					Clear all emails
				</button>
			</div>
		</div>

		<div class="flex items-center justify-start mt-1">
			<button 
				on:click={()=>{window.location.replace('/')}} 
				class="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium py-2 px-5 border border-zinc-800 rounded-xl shadow transition active:scale-95"
			>
				Back to Inbox
			</button>
		</div>
	</div>

	{#if dialogType}
		<div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
			<div role="dialog" aria-modal="true" class="bg-zinc-900 border border-zinc-800 w-full max-w-xs rounded-xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
				<h3 class="text-base font-bold text-zinc-100">
					{dialogType === 'confirm' ? 'Confirm Action' : 'Notification'}
				</h3>
				<p class="text-xs text-zinc-400 mt-2 leading-relaxed">{dialogMessage}</p>
				
				<div class="flex items-center justify-end gap-2 mt-5">
					{#if dialogType === 'confirm'}
						<button 
							on:click={closeDialog}
							class="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold px-3 py-2 rounded-lg border border-zinc-700 transition"
						>
							Cancel
						</button>
						<button 
							on:click={onDialogConfirm}
							class="bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
						>
							Confirm
						</button>
					{:else}
						<button 
							on:click={closeDialog}
							class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition min-w-[60px]"
						>
							OK
						</button>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</main>
