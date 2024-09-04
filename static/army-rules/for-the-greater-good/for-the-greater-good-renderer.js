export class ForTheGreaterGoodRenderer {
	constructor(service) {
		this.service = service;
	}

	render(element, state, playerState) {
		element.innerHTML='';
		element.innerHTML='For The Greater Good';
		this.service.observers.forEach(id => {
			element.append(id);
		})
		const addObserverBtn = document.createElement('button');
		addObserverBtn.innerHTML = 'Add observer';
		element.append(addObserverBtn);

		addObserverBtn.addEventListener('click', () => this.addObserver());
	}

	addObserver() {
		this.service.waitObserverSelect();
	}
}
