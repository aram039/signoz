/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import './Onboarding.styles.scss';

import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Card, Typography } from 'antd';
import cx from 'classnames';
import { useIsDarkMode } from 'hooks/useDarkMode';
import { useEffect, useState } from 'react';
import { useEffectOnce } from 'react-use';
import { trackEvent } from 'utils/segmentAnalytics';

import ModuleStepsContainer from './common/ModuleStepsContainer/ModuleStepsContainer';
import {
	OnboardingMethods,
	useOnboardingContext,
} from './context/OnboardingContext';
import { DataSourceType } from './Steps/DataSource/DataSource';
import {
	defaultInfraMetricsType,
	defaultLogsType,
} from './utils/dataSourceUtils';
import {
	APM_STEPS,
	getSteps,
	INFRASTRUCTURE_MONITORING_STEPS,
	LOGS_MANAGEMENT_STEPS,
} from './utils/getSteps';

export enum ModulesMap {
	APM = 'APM',
	LogsManagement = 'LogsManagement',
	InfrastructureMonitoring = 'InfrastructureMonitoring',
}

export interface ModuleProps {
	id: string;
	title: string;
	desc: string;
}

export interface SelectedModuleStepProps {
	id: string;
	title: string;
	component: any;
}

export const useCases = {
	APM: {
		id: ModulesMap.APM,
		title: 'Application Monitoring',
		desc:
			'Monitor application metrics like p99 latency, error rates, external API calls, and db calls.',
	},
	LogsManagement: {
		id: ModulesMap.LogsManagement,
		title: 'Logs Management',
		desc:
			'Easily filter and query logs, build dashboards and alerts based on attributes in logs',
	},
	InfrastructureMonitoring: {
		id: ModulesMap.InfrastructureMonitoring,
		title: 'Infrastructure Monitoring',
		desc:
			'Monitor Kubernetes infrastructure metrics, hostmetrics, or metrics of any third-party integration',
	},
};

export default function Onboarding(): JSX.Element {
	const [selectedModule, setSelectedModule] = useState<ModuleProps>(
		useCases.APM,
	);

	const [selectedModuleSteps, setSelectedModuleSteps] = useState(APM_STEPS);
	const [activeStep, setActiveStep] = useState(1);
	const [current, setCurrent] = useState(0);
	const isDarkMode = useIsDarkMode();

	const {
		updateSelectedModule,
		updateSelectedDataSource,
		resetProgress,
		selectedDataSource,
		selectedEnvironment,
		selectedMethod,
	} = useOnboardingContext();

	useEffectOnce(() => {
		trackEvent('Onboarding Started');
	});

	const setModuleStepsBasedOnSelectedDataSource = (
		selectedDataSource: DataSourceType | null,
	): void => {
		if (selectedDataSource) {
			let steps: SelectedModuleStepProps[] = [];

			steps = getSteps({
				selectedDataSource,
			});

			setSelectedModuleSteps(steps);
		}
	};

	const removeStep = (
		stepToRemove: string,
		steps: SelectedModuleStepProps[],
	): SelectedModuleStepProps[] =>
		steps.filter((step) => step.id !== stepToRemove);

	const handleAPMSteps = (): void => {
		console.log('selectedEnvironment', selectedEnvironment);
		if (selectedEnvironment === 'kubernetes') {
			const updatedSteps = removeStep('select-method', APM_STEPS);
			setSelectedModuleSteps(updatedSteps);

			return;
		}

		if (selectedMethod === OnboardingMethods.QUICK_START) {
			const updatedSteps = removeStep('setup-otel-collector', APM_STEPS);
			setSelectedModuleSteps(updatedSteps);

			return;
		}

		setSelectedModuleSteps(APM_STEPS);
	};

	useEffect(() => {
		if (selectedModule?.id === ModulesMap.InfrastructureMonitoring) {
			if (selectedDataSource) {
				setModuleStepsBasedOnSelectedDataSource(selectedDataSource);
			} else {
				setSelectedModuleSteps(INFRASTRUCTURE_MONITORING_STEPS);
				updateSelectedDataSource(defaultInfraMetricsType);
			}
		} else if (selectedModule?.id === ModulesMap.LogsManagement) {
			if (selectedDataSource) {
				setModuleStepsBasedOnSelectedDataSource(selectedDataSource);
			} else {
				setSelectedModuleSteps(LOGS_MANAGEMENT_STEPS);
				updateSelectedDataSource(defaultLogsType);
			}
		} else if (selectedModule?.id === ModulesMap.APM) {
			handleAPMSteps();
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedModule, selectedDataSource, selectedEnvironment, selectedMethod]);

	useEffect(() => {
		// on select
		trackEvent('Onboarding: Module Selected', {
			selectedModule: selectedModule.id,
		});
	}, [selectedModule]);

	const handleNext = (): void => {
		// Need to add logic to validate service name and then allow next step transition in APM module
		const isFormValid = true;

		if (isFormValid && activeStep <= 3) {
			const nextStep = activeStep + 1;

			// on next
			trackEvent('Onboarding: Next', {
				selectedModule: selectedModule.id,
				nextStepId: nextStep,
			});

			setActiveStep(nextStep);
			setCurrent(current + 1);
		}
	};

	const handleModuleSelect = (module: ModuleProps): void => {
		setSelectedModule(module);
		updateSelectedModule(module);
		updateSelectedDataSource(null);
	};

	return (
		<div className={cx('container', isDarkMode ? 'darkMode' : 'lightMode')}>
			{activeStep === 1 && (
				<>
					<div className="onboardingHeader">
						<h1>Get Started with SigNoz</h1>
						<div> Select a use-case to get started </div>
					</div>

					<div className="modulesContainer">
						<div className="moduleContainerRowStyles">
							{Object.keys(ModulesMap).map((module) => {
								const selectedUseCase = (useCases as any)[module];

								return (
									<Card
										className={cx(
											'moduleStyles',
											selectedModule.id === selectedUseCase.id ? 'selected' : '',
										)}
										style={{
											backgroundColor: isDarkMode ? '#000' : '#FFF',
										}}
										key={selectedUseCase.id}
										onClick={(): void => handleModuleSelect(selectedUseCase)}
									>
										<Typography.Title
											className="moduleTitleStyle"
											level={4}
											style={{
												borderBottom: isDarkMode ? '1px solid #303030' : '1px solid #ddd',
												backgroundColor: isDarkMode ? '#141414' : '#FFF',
											}}
										>
											{selectedUseCase.title}
										</Typography.Title>
										<Typography.Paragraph
											className="moduleDesc"
											style={{ backgroundColor: isDarkMode ? '#000' : '#FFF' }}
										>
											{selectedUseCase.desc}
										</Typography.Paragraph>
									</Card>
								);
							})}
						</div>
					</div>

					<div className="continue-to-next-step">
						<Button type="primary" icon={<ArrowRightOutlined />} onClick={handleNext}>
							Get Started
						</Button>
					</div>
				</>
			)}

			{activeStep > 1 && (
				<div className="stepsContainer">
					<ModuleStepsContainer
						onReselectModule={(): void => {
							setCurrent(current - 1);
							setActiveStep(activeStep - 1);
							setSelectedModule(useCases.APM);
							resetProgress();
						}}
						selectedModule={selectedModule}
						selectedModuleSteps={selectedModuleSteps}
					/>
				</div>
			)}
		</div>
	);
}
