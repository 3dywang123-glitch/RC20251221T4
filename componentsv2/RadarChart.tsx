
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { BigFive } from '../types';
import { useTranslation } from '../contextsv2/LanguageContext';

interface Props {
  data: BigFive | { subject: string, A: number, fullMark: number }[];
}

const RadarChartComponent: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  let chartData;

  if (Array.isArray(data)) {
    chartData = data;
  } else {
    chartData = [
      { subject: t('radar.openness'), A: data.openness, fullMark: 100 },
      { subject: t('radar.conscientiousness'), A: data.conscientiousness, fullMark: 100 },
      { subject: t('radar.extraversion'), A: data.extraversion, fullMark: 100 },
      { subject: t('radar.agreeableness'), A: data.agreeableness, fullMark: 100 },
      { subject: t('radar.neuroticism'), A: data.neuroticism, fullMark: 100 },
    ];
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#0F172A', fontSize: 10, fontWeight: 600 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name={t('radar.label')}
            dataKey="A"
            stroke="#B49155"
            strokeWidth={2}
            fill="#B49155"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChartComponent;
