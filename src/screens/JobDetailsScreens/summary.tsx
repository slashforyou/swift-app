/**
 * Summary Page - Page de résumé du job
 */

import React from 'react';
import { View } from 'react-native';
import SigningBloc from '../../components/signingBloc';
import JobProgressSection from '../../components/jobDetails/sections/JobProgressSection';
import SignatureSection from '../../components/jobDetails/sections/SignatureSection';
import ClientDetailsSection from '../../components/jobDetails/sections/ClientDetailsSection';
import ContactDetailsSection from '../../components/jobDetails/sections/ContactDetailsSection';
import AddressesSection from '../../components/jobDetails/sections/AddressesSection';
import TimeWindowsSection from '../../components/jobDetails/sections/TimeWindowsSection';
import TruckDetailsSection from '../../components/jobDetails/sections/TruckDetailsSection';

const JobSummary = ({ job, setJob } : { job: any, setJob: React.Dispatch<React.SetStateAction<any>> }) => {
    const [isSigningVisible, setIsSigningVisible] = React.useState(false);

    const handleSignContract = () => {
        setIsSigningVisible(true);
    };

    return (
        <>
            {/* Modal de signature */}
            {isSigningVisible && (
                <SigningBloc 
                    isVisible={isSigningVisible} 
                    setIsVisible={setIsSigningVisible} 
                    onSave={(signature: any) => console.log('Signature saved:', signature)} 
                    job={job} 
                    setJob={setJob}
                />
            )}

            {/* Sections modulaires */}
            <View>
                {/* Section principale : Progression du job */}
                <JobProgressSection job={job} />
                
                {/* Section signature */}
                <SignatureSection job={job} onSignContract={handleSignContract} />
                
                {/* Informations client */}
                <ClientDetailsSection job={job} />
                
                {/* Informations contact */}
                <ContactDetailsSection job={job} />
                
                {/* Adresses */}
                <AddressesSection job={job} />
                
                {/* Créneaux horaires */}
                <TimeWindowsSection job={job} />
                
                {/* Détails du camion */}
                <TruckDetailsSection job={job} />
            </View>
        </>
    );
};

export default JobSummary;
