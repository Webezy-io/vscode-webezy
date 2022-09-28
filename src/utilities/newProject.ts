/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { QuickPickItem, window, Disposable, CancellationToken, QuickInputButton, QuickInput, ExtensionContext, QuickInputButtons, Uri, ThemeIcon } from 'vscode';
import { WebezyModule } from './webezyJson';

/**
 * A multi-step input using window.createQuickPick() and window.createInputBox().
 * 
 * This first part uses the helper class `MultiStepInput` that wraps the API for the multi-step case.
 */
export async function newProject(context: ExtensionContext,webezy:WebezyModule) {

	class MyButton implements QuickInputButton {
		constructor(public iconPath: ThemeIcon, public tooltip: string) { }
	}

	const createResourceGroupButton = new MyButton(new ThemeIcon('add'),'Create Resource Group');

	const supportedLanguages: QuickPickItem[] = ['Python', 'Typescript']
		.map(label => ({ label }));


	interface State {
		title: string;
		step: number;
		totalSteps: number;
		serverLanguage: QuickPickItem | string;
		name: string;
        clients: QuickPickItem | string[];
        port: string;
        host: string;
        domain: string;
		runtime: QuickPickItem;
	}

	async function collectInputs() {
		const state = {} as Partial<State>;
		await MultiStepInput.run(input => inputProjectName(input, state));
		return state as State;
	}

	const title = 'Create Webezy Project';


	async function inputProjectName(input: MultiStepInput, state: Partial<State>) {
		state.name = await input.showInputBox({
			title,
			step: 1,
			totalSteps: 6,
			value: typeof state.name === 'string' ? state.name : '',
			prompt: 'Choose a unique name for the project',
			validate: validateNameIsUnique,
			shouldResume: shouldResume
		});
		return (input: MultiStepInput) => inputProjectLanguage(input, state);
	}

	async function inputProjectLanguage(input: MultiStepInput, state: Partial<State>) {
		const pick = await input.showQuickPick({
			title,
			step: 2,
			totalSteps: 6,
			placeholder: 'Choose project language (server side)',
			items: supportedLanguages,
			activeItem: typeof state.serverLanguage !== 'string' ? state.serverLanguage : undefined,
			shouldResume: shouldResume
		});
	
        state.serverLanguage = pick;
		return (input: MultiStepInput) => inputProjectClients(input, state);
	}

	async function inputProjectClients(input: MultiStepInput, state: Partial<State>) {
		const pick = await input.showQuickPick({
			title,
			step: 3,
			totalSteps: 6,
			placeholder: 'Choose project clients',
			items: supportedLanguages,
            canSelectMany: true,
			activeItem: typeof state.clients !== 'object' ? state.clients : undefined,
			shouldResume: shouldResume,
            validate:validateClientsSelection
		});
		
		state.clients = pick;
		return (input: MultiStepInput) => inputDomainName(input, state);
	}


	async function inputDomainName(input: MultiStepInput, state: Partial<State>) {
		// TODO: Remember current value when navigating back.
		state.domain = await input.showInputBox({
			title,
			step: 4,
			totalSteps: 6 ,
			value: state.domain || 'domain',
			prompt: 'Enter your organization domain',
			validate: validateDomain,
			shouldResume: shouldResume
		});
		return (input: MultiStepInput) => inputHostName(input, state);
	}

	async function inputHostName(input: MultiStepInput, state: Partial<State>) {
		// TODO: Remember current value when navigating back.
		state.host = await input.showInputBox({
			title,
			step: 5,
			totalSteps: 6 ,
			value: state.host || 'localhost',
			prompt: 'Enter the host name',
			validate: validateHostName,
			shouldResume: shouldResume
		});
		return (input: MultiStepInput) => inputPort(input, state);
	}

	async function inputPort(input: MultiStepInput, state: Partial<State>) {
		// TODO: Remember current value when navigating back.
		state.port = await input.showInputBox({
			title,
			step: 6,
			totalSteps: 6 ,
			value: state.port || '50051',
			prompt: 'Enter the port number',
			validate: validatePortNumber,
			shouldResume: shouldResume
		});
	}
	// async function pickRuntime(input: MultiStepInput, state: Partial<State>) {
	// 	const additionalSteps = typeof state.resourceGroup === 'string' ? 1 : 0;
	// 	const runtimes = await getAvailableRuntimes(state.resourceGroup!, undefined /* TODO: token */);
	// 	// TODO: Remember currently active item when navigating back.
	// 	state.runtime = await input.showQuickPick({
	// 		title,
	// 		step: 6 + additionalSteps,
	// 		totalSteps: 6 + additionalSteps,
	// 		placeholder: 'Pick a runtime',
	// 		items: runtimes,
	// 		activeItem: state.runtime,
	// 		shouldResume: shouldResume
	// 	});
	// }

	function shouldResume() {
		// Could show a notification with the option to resume.
		return new Promise<boolean>((resolve, reject) => {
			// noop
		});
	}

    function validateClientsSelection(clients: any) {
		return clients.length > 0 ? undefined : 'Must choose atleast 1 client';
	}

	async function validateNameIsUnique(name: string) {
		return webezy.projects[name] !== undefined ? 'Project name not unique' : undefined;
	}

    async function validateDomain(name:string) {
        return name.includes('.') ? 'Domain must not include any suffix' : undefined;
    }

    async function validateHostName(host:string) {
        return host !== 'localhost' ? undefined : host.includes('.') ? undefined : 'Host name must be a valid DNS or IP address.';
    }

    async function validatePortNumber(port:string) {
        if (port.trim() === '') {
            return 'Value must be a valid integer.';
        }
        
        return Number.isNaN(Number(port)) ? 'Value must be a valid integer.' : undefined ;
    }

	async function getAvailableRuntimes(resourceGroup: QuickPickItem | string, token?: CancellationToken): Promise<QuickPickItem[]> {
		// ...retrieve...
		// await new Promise(resolve => setTimeout(resolve, 1000));
		return ['Node 8.9', 'Node 6.11', 'Node 4.5']
			.map(label => ({ label }));
	}

	const state = await collectInputs();
	window.showInformationMessage(`Creating Application Service '${state.name}'`);
    return state;
}


// -------------------------------------------------------
// Helper code that wraps the API for the multi-step case.
// -------------------------------------------------------


class InputFlowAction {
	static back = new InputFlowAction();
	static cancel = new InputFlowAction();
	static resume = new InputFlowAction();
}

type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;

interface QuickPickParameters<T extends QuickPickItem> {
	title: string;
	step: number;
	totalSteps: number;
	items: T[];
	activeItem?: T;
    canSelectMany?:boolean;
	placeholder: string;
	buttons?: QuickInputButton[];
	shouldResume: () => Thenable<boolean>;
	validate?: (value: string) => string | undefined;
}

interface InputBoxParameters {
	title: string;
	step: number;
	totalSteps: number;
	value: string;
	prompt: string;
	validate: (value: string) => Promise<string | undefined>;
	buttons?: QuickInputButton[];
	shouldResume: () => Thenable<boolean>;
}

class MultiStepInput {

	static async run<T>(start: InputStep) {
		const input = new MultiStepInput();
		return input.stepThrough(start);
	}

	private current?: QuickInput;
	private steps: InputStep[] = [];

	private async stepThrough<T>(start: InputStep) {
		let step: InputStep | void = start;
		while (step) {
			this.steps.push(step);
			if (this.current) {
				this.current.enabled = false;
				this.current.busy = true;
			}
			try {
				step = await step(this);
			} catch (err) {
				if (err === InputFlowAction.back) {
					this.steps.pop();
					step = this.steps.pop();
				} else if (err === InputFlowAction.resume) {
					step = this.steps.pop();
				} else if (err === InputFlowAction.cancel) {
					step = undefined;
				} else {
					throw err;
				}
			}
		}
		if (this.current) {
			this.current.dispose();
		}
	}

	async showQuickPick<T extends QuickPickItem, P extends QuickPickParameters<T>>({ title, step, totalSteps, items, activeItem, placeholder, buttons, canSelectMany, shouldResume, validate }: P) {
		const disposables: Disposable[] = [];
		try {
			return await new Promise<T | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
				const input = window.createQuickPick<T>();
                let itemsSelected :any = [];
				input.title = title;
				input.step = step;
				input.totalSteps = totalSteps;
				input.placeholder = placeholder;
				input.items = items;
                input.canSelectMany = canSelectMany ? canSelectMany : false;
				if (activeItem) {
					input.activeItems = [activeItem];
				}
				input.buttons = [
					...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
					...(buttons || [])
				];
				disposables.push(
					input.onDidTriggerButton(item => {
						if (item === QuickInputButtons.Back) {
							reject(InputFlowAction.back);
						} else {
                            if (!input.canSelectMany) {
                                resolve(<any>item);
                            }
						}
					}),
					input.onDidHide(() => {
						(async () => {
							reject(shouldResume && await shouldResume() ? InputFlowAction.resume : InputFlowAction.cancel);
						})()
							.catch(reject);
					})
                    
				);
                if (input.canSelectMany) {
                    disposables.push(input.onDidChangeSelection(items => itemsSelected = items));
                    disposables.push(input.onDidAccept(() => {
                        if (validate) {
                            let validation = validate(itemsSelected);
                            if ( validation === undefined) {
                                resolve(itemsSelected);
                            } else {
                                window.showErrorMessage(validation);
                            }
                        } else {
                            resolve(itemsSelected);
                        }
                    }));
                } else {
                    disposables.push(input.onDidChangeSelection(items => resolve(items[0])));
                }
				if (this.current) {
					this.current.dispose();
				}
				this.current = input;
				this.current.show();
			});
		} finally {
			disposables.forEach(d => d.dispose());
		}
	}

	async showInputBox<P extends InputBoxParameters>({ title, step, totalSteps, value, prompt, validate, buttons, shouldResume }: P) {
		const disposables: Disposable[] = [];
		try {
			return await new Promise<string | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
				const input = window.createInputBox();
				input.title = title;
				input.step = step;
				input.totalSteps = totalSteps;
				input.value = value || '';
				input.prompt = prompt;
				input.buttons = [
					...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
					...(buttons || [])
				];
				let validating = validate('');
				disposables.push(
					input.onDidTriggerButton(item => {
						if (item === QuickInputButtons.Back) {
							reject(InputFlowAction.back);
						} else {
							resolve(<any>item);
						}
					}),
					input.onDidAccept(async () => {
						const value = input.value;
						input.enabled = false;
						input.busy = true;
						if (!(await validate(value))) {
							resolve(value);
						}
						input.enabled = true;
						input.busy = false;
					}),
					input.onDidChangeValue(async text => {
						const current = validate(text);
						validating = current;
						const validationMessage = await current;
						if (current === validating) {
							input.validationMessage = validationMessage;
						}
					}),
					input.onDidHide(() => {
						(async () => {
							reject(shouldResume && await shouldResume() ? InputFlowAction.resume : InputFlowAction.cancel);
						})()
							.catch(reject);
					})
				);
				if (this.current) {
					this.current.dispose();
				}
				this.current = input;
				this.current.show();
			});
		} finally {
			disposables.forEach(d => d.dispose());
		}
	}
}