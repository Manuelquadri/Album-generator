import React from 'react';
import { AppStep } from '../types';
import { Check, ChevronRight } from 'lucide-react';

interface StepWizardProps {
  currentStep: AppStep;
  setStep: (step: AppStep) => void;
}

const steps = [
  { id: AppStep.DETAILS, label: 'Detalles' },
  { id: AppStep.UPLOAD, label: 'Fotos' },
  { id: AppStep.STANDARDIZE, label: 'Ajustar' },
  { id: AppStep.EDIT, label: 'Editar' },
  { id: AppStep.COVER, label: 'Portada AI' },
  { id: AppStep.PREVIEW, label: 'Imprimir' },
];

export const StepWizard: React.FC<StepWizardProps> = ({ currentStep, setStep }) => {
  return (
    <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center space-x-2 md:space-x-8 overflow-x-auto no-scrollbar">
            {steps.map((step, index) => (
              <li key={step.id} className="flex-shrink-0">
                <div 
                  className={`flex items-center group ${currentStep >= step.id ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                  // Prevent skipping standardization if photos aren't processed
                  onClick={() => currentStep >= step.id && setStep(step.id)}
                >
                  <span className={`
                    flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-semibold transition-colors
                    ${currentStep > step.id ? 'bg-brand-dark border-brand-dark text-white' : 
                      currentStep === step.id ? 'border-brand-dark text-brand-dark' : 'border-gray-300 text-gray-500'}
                  `}>
                    {currentStep > step.id ? <Check className="w-4 h-4" /> : index + 1}
                  </span>
                  <span className={`ml-3 text-sm font-medium ${currentStep === step.id ? 'text-brand-dark' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 ml-4 text-gray-300 hidden md:block" />
                  )}
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  );
};