/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SocietyProvider, useSociety } from './context/SocietyContext';
import { Navbar } from './components/Navbar';
import { LiveStatusStrip } from './components/LiveStatusStrip';
import { PublicLandingView } from './components/views/PublicLandingView';
import { PendingAccessView } from './components/views/PendingAccessView';
import { HomeView } from './components/views/HomeView';
import { AmenitiesView } from './components/views/AmenitiesView';
import { ParkingView } from './components/views/ParkingView';
import { DocumentRepositoryView } from './components/views/DocumentRepositoryView';
import { TenantsView } from './components/views/TenantsView';
import { HelpdeskView } from './components/views/HelpdeskView';
import { CommitteeView } from './components/views/CommitteeView';
import { SupervisorInspectionView } from './components/views/SupervisorInspectionView';
import { DirectoryView } from './components/views/DirectoryView';
import { ProcurementView } from './components/views/ProcurementView';
import { ResidentRegistryView } from './components/views/ResidentRegistryView';
import { SocietyGalleryView } from './components/views/SocietyGalleryView';
import { MaintenanceView } from './components/views/MaintenanceView';
import { Footer } from './components/Footer';
import { EmergencyModal } from './components/EmergencyModal';
import { BookingModal } from './components/BookingModal';
import { LoginModal } from './components/LoginModal';
import { AdminSettingsModal } from './components/AdminSettingsModal';

const AppContent: React.FC = () => {
  const {
    activeTab,
    isAuthenticated,
    isPendingApproval,
    isRejected,
    openLoginModal,
  } = useSociety();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Global Navbar */}
      <Navbar />

      {/* Real-time Utility & Society status strip */}
      <LiveStatusStrip />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {!isAuthenticated ? (
          activeTab === 'gallery' ? (
            <SocietyGalleryView />
          ) : (
            <PublicLandingView
              onOpenLogin={() => openLoginModal('login')}
              onOpenRegister={() => openLoginModal('register')}
            />
          )
        ) : (isPendingApproval || isRejected) ? (
          activeTab === 'gallery' ? (
            <SocietyGalleryView />
          ) : (
            <PendingAccessView />
          )
        ) : (
          <>
            {activeTab === 'home' && <HomeView />}
            {(activeTab === 'helpdesk') && <HelpdeskView />}
            {(activeTab === 'registry' || activeTab === 'committee' || activeTab === 'directory') && (
              <ResidentRegistryView />
            )}
            {(activeTab === 'vehicles' || activeTab === 'parking') && <ParkingView />}
            {activeTab === 'gallery' && <SocietyGalleryView />}
            {(activeTab === 'procurement') && <ProcurementView />}
            {(activeTab === 'maintenance' || activeTab === 'dues') && <MaintenanceView />}
            {/* Contextual & direct dashboard links */}
            {activeTab === 'amenities' && <AmenitiesView />}
            {activeTab === 'tenants' && <TenantsView />}
            {activeTab === 'documents' && <DocumentRepositoryView />}
            {(activeTab === 'inspection' || activeTab === 'supervisor') && <SupervisorInspectionView />}
          </>
        )}
      </main>

      {/* 4-Column Footer */}
      <Footer />

      {/* Global Interactive Modals */}
      <EmergencyModal />
      <BookingModal />
      <LoginModal />
      <AdminSettingsModal />
    </div>
  );
};

export default function App() {
  return (
    <SocietyProvider>
      <AppContent />
    </SocietyProvider>
  );
}
