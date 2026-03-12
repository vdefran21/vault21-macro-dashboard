import { useState } from 'react';
import { useDashboardData } from './hooks/useDashboardData';

// Layout
import Header from './components/layout/Header';
import TabNavigation from './components/layout/TabNavigation';
import StatusBar from './components/layout/StatusBar';
import LoadingSpinner from './components/shared/LoadingSpinner';

// Overview
import StatGrid from './components/overview/StatGrid';
import DefaultRateChart from './components/overview/DefaultRateChart';
import SectorExposure from './components/overview/SectorExposure';
import PIKTrend from './components/overview/PIKTrend';
import MaturityWall from './components/overview/MaturityWall';

// Redemptions
import FundScorecard from './components/redemptions/FundScorecard';
import RedemptionRateChart from './components/redemptions/RedemptionRateChart';
import DollarFlowChart from './components/redemptions/DollarFlowChart';

// Contagion
import TransmissionChain from './components/contagion/TransmissionChain';
import BankExposure from './components/contagion/BankExposure';
import AltManagerEquity from './components/contagion/AltManagerEquity';

// Timeline
import SeverityChart from './components/timeline/SeverityChart';
import EventLog from './components/timeline/EventLog';

/**
 * Root dashboard component. Fetches data via useDashboardData hook
 * and renders the active tab's components.
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const { data, loading, refreshing, lastRefresh, error, triggerRefresh } = useDashboardData();

  if (loading) return <LoadingSpinner />;

  if (error && !data) {
    return (
      <div className="min-h-screen bg-vault-bg flex items-center justify-center">
        <div className="text-center">
          <div className="font-mono text-vault-red text-sm tracking-[2px] uppercase mb-2">ERROR</div>
          <div className="font-mono text-vault-gray text-xs">{error}</div>
          <button
            onClick={triggerRefresh}
            className="mt-4 font-mono text-[10px] tracking-[1px] uppercase px-3 py-1.5 rounded
              border border-vault-card-border bg-vault-card text-vault-gray hover:text-vault-amber"
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  const { overview, redemptions, contagion, timeline, meta } = data || {};

  return (
    <div className="min-h-screen bg-vault-bg text-vault-white font-sans px-5 py-6">
      <Header refreshing={refreshing} onRefresh={triggerRefresh} />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Overview Tab */}
      {activeTab === 'overview' && overview && (
        <div className="flex flex-col gap-4">
          <StatGrid stats={overview.stats} />
          <DefaultRateChart data={overview.default_rates} />
          <div className="grid grid-cols-2 gap-4">
            <SectorExposure data={overview.sector_exposure} />
            <PIKTrend data={overview.pik_trend} />
          </div>
          <MaturityWall data={overview.maturity_wall} />
        </div>
      )}

      {/* Redemptions Tab */}
      {activeTab === 'redemptions' && redemptions && (
        <div className="flex flex-col gap-4">
          <FundScorecard funds={redemptions.funds} />
          <RedemptionRateChart data={redemptions.rate_chart} />
          <DollarFlowChart data={redemptions.dollar_flows} />
        </div>
      )}

      {/* Contagion Tab */}
      {activeTab === 'contagion' && contagion && (
        <div className="flex flex-col gap-4">
          <TransmissionChain chain={contagion.chain} />
          <BankExposure data={contagion.bank_exposures} />
          <AltManagerEquity data={contagion.alt_manager_equity} />
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && timeline && (
        <div className="flex flex-col gap-4">
          <SeverityChart data={timeline.severity_chart} />
          <EventLog events={timeline.events} />
          <div className="font-mono text-[10px] text-vault-gray-dark text-center py-2 border-t border-vault-card-border">
            DATA COMPILED FROM BLOOMBERG, REUTERS, CNBC, FT, PITCHBOOK
            <br />
            VAULT21 MACRO REGIME ANALYSIS — FIVE-ANALYST TRIANGULATION FRAMEWORK
          </div>
        </div>
      )}

      <StatusBar lastRefresh={lastRefresh} meta={meta} />
    </div>
  );
}
