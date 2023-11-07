/* eslint-disable sonarjs/cognitive-complexity */
import './uPlotLib.styles.scss';

import { FullViewProps } from 'container/GridCardLayout/GridCard/FullView/types';
import { Dimensions } from 'hooks/useDimensions';
import _noop from 'lodash-es/noop';
import { MetricRangePayloadProps } from 'types/api/metrics/getQueryRange';
import uPlot from 'uplot';

import onClickPlugin, { OnClickPluginOpts } from './plugins/onClickPlugin';
import tooltipPlugin from './plugins/tooltipPlugin';
import getAxes from './utils/getAxes';
import getSeries from './utils/getSeriesData';

interface GetUPlotChartOptions {
	id?: string;
	apiResponse?: MetricRangePayloadProps;
	dimensions: Dimensions;
	isDarkMode: boolean;
	onDragSelect: (startTime: number, endTime: number) => void;
	yAxisUnit?: string;
	onClickHandler?: OnClickPluginOpts['onClick'];
	graphsVisibilityStates?: boolean[];
	setGraphsVisibilityStates?: FullViewProps['setGraphsVisibilityStates'];
}

export const getUPlotChartOptions = ({
	id,
	dimensions,
	isDarkMode,
	apiResponse,
	onDragSelect,
	yAxisUnit,
	onClickHandler = _noop,
	graphsVisibilityStates,
	setGraphsVisibilityStates,
}: GetUPlotChartOptions): uPlot.Options => ({
	id,
	width: dimensions.width,
	height: dimensions.height - 50,
	// tzDate: (ts) => uPlot.tzDate(new Date(ts * 1e3), ''), //  Pass timezone for 2nd param
	legend: {
		show: true,
		live: false,
	},
	focus: {
		alpha: 0.3,
	},
	cursor: {
		focus: {
			prox: 1e6,
			bias: 1,
		},
		points: {
			size: (u, seriesIdx): number => u.series[seriesIdx].points.size * 2.5,
			width: (u, seriesIdx, size): number => size / 4,
			stroke: (u, seriesIdx): string =>
				`${u.series[seriesIdx].points.stroke(u, seriesIdx)}90`,
			fill: (): string => '#fff',
		},
	},
	padding: [16, 16, 16, 16],
	scales: {
		x: {
			time: true,
			auto: true, // Automatically adjust scale range
		},
		y: {
			auto: true,
		},
	},
	plugins: [
		tooltipPlugin(apiResponse, yAxisUnit),
		onClickPlugin({
			onClick: onClickHandler,
		}),
	],
	hooks: {
		setSelect: [
			(self): void => {
				const selection = self.select;
				if (selection) {
					const startTime = self.posToVal(selection.left, 'x');
					const endTime = self.posToVal(selection.left + selection.width, 'x');

					const diff = endTime - startTime;

					if (diff > 0) {
						onDragSelect(startTime * 1000, endTime * 1000);
					}
				}
			},
		],
		ready: [
			(self): void => {
				const legend = self.root.querySelector('.u-legend');
				if (legend) {
					const seriesEls = legend.querySelectorAll('.u-label');
					const seriesArray = Array.from(seriesEls);
					seriesArray.forEach((seriesEl, index) => {
						seriesEl.addEventListener('click', () => {
							if (graphsVisibilityStates) {
								setGraphsVisibilityStates?.((prev) => {
									const newGraphVisibilityStates = [...prev];
									newGraphVisibilityStates[index + 1] = !newGraphVisibilityStates[
										index + 1
									];
									return newGraphVisibilityStates;
								});
							}
						});
					});
				}
			},
		],
	},
	series: getSeries(
		apiResponse,
		apiResponse?.data.result,
		graphsVisibilityStates,
	),
	axes: getAxes(isDarkMode, yAxisUnit),
});