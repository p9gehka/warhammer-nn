export class ForTheGreaterGoodRenderer {
	constructor(service) {
		this.service = service;
	}

	render(element, state, playerState) {
		element.innerHTML='';
		element.innerHTML='For The Greater Good';
		element.append('\n');
		element.append(this.service.detachment);
		element.append('\n');
		element.append(JSON.stringify(this.service.observers));

		const addObserverBtn = document.createElement('button');
		addObserverBtn.innerHTML = 'Add observer';
		element.append(addObserverBtn);

		addObserverBtn.addEventListener('click', () => { 
			this.addObserver();
			this.render(element, state, playerState);
		});
	}

	addObserver() {
		this.service.waitObserverSelect();
	}
}
