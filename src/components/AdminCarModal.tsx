import { useEffect, useState } from 'react';
import { ArrowUp, ImagePlus, Plus, Trash2, X } from 'lucide-react';
import type {
  AccidentHistory,
  BatteryDetails,
  Car,
  CarPhoto,
  CarStatus,
  DocumentItem,
  DocumentStatus,
  FuelType,
  InspectionCondition,
  InspectionItem,
  PhotoCategory,
  PriceType,
  ServiceRecord,
  TransmissionType,
  TyreDetail,
  UsageHistory,
} from '../types/car';
import { createCar, updateCar, uploadCarImages } from '../utils/api';
import {
  createDefaultAccidentHistory,
  createDefaultBattery,
  createDefaultDocuments,
  createDefaultInspectionList,
  createDefaultTyres,
  createDefaultUsageHistory,
  EXTERIOR_COMPONENTS,
  INTERIOR_COMPONENTS,
  MECHANICAL_COMPONENTS,
} from '../utils/carDefaults';
import { VehicleImage } from './VehicleImage';

interface AdminCarModalProps {
  car: Car | null;
  open: boolean;
  onClose: () => void;
  onSaved: (saved: Car) => void;
}

type ModalTab = 'basic' | 'gallery' | 'specs' | 'history' | 'inspection';

const PHOTO_CATEGORIES: PhotoCategory[] = [
  'Exterior',
  'Interior',
  'Engine & Mechanical',
  'Underbody & Storage',
];

export function AdminCarModal({ car, open, onClose, onSaved }: AdminCarModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('basic');

  // Basic & Pricing
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [variant, setVariant] = useState('');
  const [year, setYear] = useState('2023');
  const [registrationYear, setRegistrationYear] = useState('2023');
  const [registrationDate, setRegistrationDate] = useState('');
  const [priceInr, setPriceInr] = useState('');
  const [priceType, setPriceType] = useState<PriceType>('Negotiable');
  const [priceExplanation, setPriceExplanation] = useState('');
  const [marketComparisonNote, setMarketComparisonNote] = useState('');
  const [discountNote, setDiscountNote] = useState('');
  const [kilometres, setKilometres] = useState('');
  const [fuelType, setFuelType] = useState<FuelType>('Petrol');
  const [transmission, setTransmission] = useState<TransmissionType>('Automatic');
  const [ownership, setOwnership] = useState('1st Owner');
  const [location, setLocation] = useState('Mumbai, MH');
  const [status, setStatus] = useState<CarStatus>('Available');
  const [featured, setFeatured] = useState(false);
  const [warrantyPeriod, setWarrantyPeriod] = useState('1 Year');
  const [warrantyDetails, setWarrantyDetails] = useState('Engine, Gearbox, Electronics & 24×7 Roadside Assistance');
  const [videoWalkthroughUrl, setVideoWalkthroughUrl] = useState('');
  const [description, setDescription] = useState('');
  const [highlightsText, setHighlightsText] = useState('');
  const [sellerName, setSellerName] = useState('Strada Worli Flagship Gallery');
  const [sellerType, setSellerType] = useState<Car['sellerType']>('Certified Gallery');
  const [sellerProfile, setSellerProfile] = useState('');
  const [sellerPhone, setSellerPhone] = useState('+91 98204 51090');
  const [sellerWhatsapp, setSellerWhatsapp] = useState('919820451090');

  // Categorized Gallery (up to 35 photos)
  const [gallery, setGallery] = useState<CarPhoto[]>([]);
  const [uploadCategory, setUploadCategory] = useState<PhotoCategory>('Exterior');
  const [uploadAngleLabel, setUploadAngleLabel] = useState('Front-Left 45° View');
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Specs & Features
  const [category, setCategory] = useState('Luxury Performance');
  const [bodyType, setBodyType] = useState('Coupe');
  const [color, setColor] = useState('');
  const [interiorColor, setInteriorColor] = useState('');
  const [seatingCapacity, setSeatingCapacity] = useState('5');
  const [doors, setDoors] = useState('4');
  const [engineCc, setEngineCc] = useState('');
  const [engine, setEngine] = useState('');
  const [cylinders, setCylinders] = useState('');
  const [power, setPower] = useState('');
  const [torque, setTorque] = useState('');
  const [drivetrain, setDrivetrain] = useState('');
  const [claimedMileage, setClaimedMileage] = useState('');
  const [emissionStandard, setEmissionStandard] = useState('BS6');
  const [registrationState, setRegistrationState] = useState('');
  const [insuranceValidUntil, setInsuranceValidUntil] = useState('');
  const [comfortText, setComfortText] = useState('');
  const [entertainmentText, setEntertainmentText] = useState('');
  const [safetyText, setSafetyText] = useState('');
  const [exteriorFeaturesText, setExteriorFeaturesText] = useState('');

  // Usage, Accident & Service History
  const [usageHistory, setUsageHistory] = useState<UsageHistory>(createDefaultUsageHistory());
  const [accidentHistory, setAccidentHistory] = useState<AccidentHistory>(createDefaultAccidentHistory());
  const [lastServiceDate, setLastServiceDate] = useState('');
  const [lastServiceOdometerKm, setLastServiceOdometerKm] = useState('');
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);

  // Inspection, Tyres, Battery & Documents
  const [inspectionSubTab, setInspectionSubTab] = useState<'exterior' | 'interior' | 'mechanical' | 'tyres' | 'docs'>('exterior');
  const [exteriorReport, setExteriorReport] = useState<InspectionItem[]>([]);
  const [interiorReport, setInteriorReport] = useState<InspectionItem[]>([]);
  const [mechanicalReport, setMechanicalReport] = useState<InspectionItem[]>([]);
  const [tyreDetails, setTyreDetails] = useState<TyreDetail[]>([]);
  const [batteryDetails, setBatteryDetails] = useState<BatteryDetails>(createDefaultBattery());
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setActiveTab('basic');
    setError('');

    if (car) {
      setBrand(car.brand);
      setModel(car.model);
      setVariant(car.variant);
      setYear(String(car.year));
      setRegistrationYear(String(car.registrationYear || car.year));
      setRegistrationDate(car.registrationDate || '');
      setPriceInr(String(car.priceInr));
      setPriceType(car.priceType || 'Negotiable');
      setPriceExplanation(car.priceExplanation || '');
      setMarketComparisonNote(car.marketComparisonNote || '');
      setDiscountNote(car.discountNote || '');
      setKilometres(String(car.kilometres));
      setFuelType(car.fuelType);
      setTransmission(car.transmission);
      setOwnership(car.ownership);
      setLocation(car.location);
      setStatus(car.status);
      setFeatured(car.featured);
      setWarrantyPeriod(car.warrantyPeriod || '1 Year');
      setWarrantyDetails(car.warrantyDetails || 'Engine, Gearbox, Electronics & 24×7 Roadside Assistance');
      setVideoWalkthroughUrl(car.videoWalkthroughUrl || '');
      setDescription(car.description);
      setHighlightsText(car.highlights.join('\n'));
      setSellerName(car.sellerName);
      setSellerType(car.sellerType || 'Certified Gallery');
      setSellerProfile(car.sellerProfile || '');
      setSellerPhone(car.sellerPhone);
      setSellerWhatsapp(car.sellerWhatsapp);

      setGallery(car.gallery || []);

      setCategory(car.category || '');
      setBodyType(car.bodyType || '');
      setColor(car.color || '');
      setInteriorColor(car.interiorColor || '');
      setSeatingCapacity(car.seatingCapacity ? String(car.seatingCapacity) : '');
      setDoors(car.doors ? String(car.doors) : '');
      setEngineCc(car.engineCc || '');
      setEngine(car.engine || '');
      setCylinders(car.cylinders || '');
      setPower(car.power || '');
      setTorque(car.torque || '');
      setDrivetrain(car.drivetrain || '');
      setClaimedMileage(car.claimedMileage || '');
      setEmissionStandard(car.emissionStandard || '');
      setRegistrationState(car.registrationState || '');
      setInsuranceValidUntil(car.insuranceValidUntil || '');
      setComfortText((car.features?.comfort || []).join('\n'));
      setEntertainmentText((car.features?.entertainment || []).join('\n'));
      setSafetyText((car.features?.safety || []).join('\n'));
      setExteriorFeaturesText((car.features?.exterior || []).join('\n'));

      setUsageHistory(car.usageHistory || createDefaultUsageHistory());
      setAccidentHistory(car.accidentHistory || createDefaultAccidentHistory());
      setLastServiceDate(car.serviceHistory?.lastServiceDate || '');
      setLastServiceOdometerKm(
        car.serviceHistory?.lastServiceOdometerKm !== undefined
          ? String(car.serviceHistory.lastServiceOdometerKm)
          : ''
      );
      setServiceRecords(car.serviceHistory?.records || []);

      setExteriorReport(car.exteriorReport || createDefaultInspectionList(EXTERIOR_COMPONENTS));
      setInteriorReport(car.interiorReport || createDefaultInspectionList(INTERIOR_COMPONENTS));
      setMechanicalReport(car.mechanicalReport || createDefaultInspectionList(MECHANICAL_COMPONENTS));
      setTyreDetails(car.tyreDetails || createDefaultTyres());
      setBatteryDetails(car.batteryDetails || createDefaultBattery());
      setDocuments(car.documents || createDefaultDocuments());
    } else {
      setBrand('');
      setModel('');
      setVariant('');
      setYear('2023');
      setRegistrationYear('2023');
      setRegistrationDate('');
      setPriceInr('');
      setPriceType('Negotiable');
      setPriceExplanation('');
      setMarketComparisonNote('');
      setDiscountNote('');
      setKilometres('');
      setFuelType('Petrol');
      setTransmission('Automatic');
      setOwnership('1st Owner');
      setLocation('Mumbai, MH');
      setStatus('Available');
      setFeatured(false);
      setWarrantyPeriod('1 Year');
      setWarrantyDetails('Engine, Gearbox, Electronics & 24×7 Roadside Assistance');
      setVideoWalkthroughUrl('');
      setDescription('');
      setHighlightsText('');
      setSellerName('Strada Worli Flagship Gallery');
      setSellerType('Certified Gallery');
      setSellerProfile('');
      setSellerPhone('+91 98204 51090');
      setSellerWhatsapp('919820451090');
      setGallery([]);

      setCategory('Luxury Sedan');
      setBodyType('Sedan');
      setColor('');
      setInteriorColor('');
      setSeatingCapacity('5');
      setDoors('4');
      setEngineCc('');
      setEngine('');
      setCylinders('');
      setPower('');
      setTorque('');
      setDrivetrain('');
      setClaimedMileage('');
      setEmissionStandard('BS6');
      setRegistrationState('');
      setInsuranceValidUntil('');
      setComfortText('');
      setEntertainmentText('');
      setSafetyText('');
      setExteriorFeaturesText('');

      setUsageHistory(createDefaultUsageHistory());
      setAccidentHistory(createDefaultAccidentHistory());
      setLastServiceDate('');
      setLastServiceOdometerKm('');
      setServiceRecords([]);

      setExteriorReport(createDefaultInspectionList(EXTERIOR_COMPONENTS));
      setInteriorReport(createDefaultInspectionList(INTERIOR_COMPONENTS));
      setMechanicalReport(createDefaultInspectionList(MECHANICAL_COMPONENTS));
      setTyreDetails(createDefaultTyres());
      setBatteryDetails(createDefaultBattery());
      setDocuments(createDefaultDocuments());
    }
  }, [car, open]);

  if (!open) return null;

  const linesToArray = (text: string) =>
    text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    if (gallery.length + fileList.length > 35) {
      setError('Maximum 35 photographs allowed per vehicle listing.');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const uploadedUrls = await uploadCarImages(Array.from(fileList));
      setGallery((prev) => [
        ...prev,
        ...uploadedUrls.map((url, idx) => ({
          id: `photo-${Date.now()}-${idx}`,
          url,
          category: uploadCategory,
          angleLabel: uploadAngleLabel.trim() || `${uploadCategory} Photo`,
          order: prev.length + idx,
        })),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload images.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function handleAddImageUrl() {
    const trimmed = customImageUrl.trim();
    if (!trimmed) return;
    if (gallery.length >= 35) {
      setError('Maximum 35 photographs allowed per vehicle.');
      return;
    }
    setGallery((prev) => [
      ...prev,
      {
        id: `photo-${Date.now()}`,
        url: trimmed,
        category: uploadCategory,
        angleLabel: uploadAngleLabel.trim() || `${uploadCategory} View`,
        order: prev.length,
      },
    ]);
    setCustomImageUrl('');
  }

  function promotePrimary(index: number) {
    if (index === 0) return;
    setGallery((prev) => {
      const next = [...prev];
      const [picked] = next.splice(index, 1);
      return [picked, ...next].map((item, idx) => ({ ...item, order: idx }));
    });
  }

  function removePhoto(index: number) {
    setGallery((prev) => prev.filter((_, i) => i !== index).map((item, idx) => ({ ...item, order: idx })));
  }

  function addServiceRecord() {
    setServiceRecords((prev) => [
      {
        id: `srv-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        odometerKm: undefined,
        serviceCenter: '',
        summary: '',
        receiptNote: '',
      },
      ...prev,
    ]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const isDraft = status === 'Draft';

    if (!brand.trim() || !model.trim()) {
      setError('Brand and Model are required even for Draft listings.');
      setActiveTab('basic');
      return;
    }
    if (!isDraft && (!priceInr || Number(priceInr) <= 0)) {
      setError('Please enter a valid Price in INR, or save the listing as Draft.');
      setActiveTab('basic');
      return;
    }

    setSaving(true);
    const payload: Partial<Car> = {
      brand: brand.trim(),
      model: model.trim(),
      variant: variant.trim() || 'Standard',
      year: Number(year) || 2023,
      registrationYear: Number(registrationYear) || Number(year) || 2023,
      registrationDate: registrationDate || undefined,
      priceInr: Number(priceInr) || 0,
      priceType,
      priceExplanation: priceExplanation.trim(),
      marketComparisonNote: marketComparisonNote.trim(),
      discountNote: discountNote.trim(),
      kilometres: Number(kilometres) || 0,
      fuelType,
      transmission,
      ownership: ownership.trim(),
      location: location.trim(),
      status,
      featured,
      warrantyPeriod: warrantyPeriod.trim() || '1 Year',
      warrantyDetails: warrantyDetails.trim(),
      videoWalkthroughUrl: videoWalkthroughUrl.trim(),
      description: description.trim(),
      highlights: linesToArray(highlightsText),
      sellerName: sellerName.trim(),
      sellerType,
      sellerProfile: sellerProfile.trim(),
      sellerPhone: sellerPhone.trim(),
      sellerWhatsapp: sellerWhatsapp.trim(),
      gallery,
      images: gallery.map((g) => g.url),
      category: category.trim(),
      bodyType: bodyType.trim(),
      color: color.trim(),
      interiorColor: interiorColor.trim(),
      seatingCapacity: seatingCapacity ? Number(seatingCapacity) : undefined,
      doors: doors ? Number(doors) : undefined,
      engineCc: engineCc.trim(),
      engine: engine.trim(),
      cylinders: cylinders.trim(),
      power: power.trim(),
      torque: torque.trim(),
      drivetrain: drivetrain.trim(),
      claimedMileage: claimedMileage.trim(),
      emissionStandard: emissionStandard.trim(),
      registrationState: registrationState.trim(),
      insuranceValidUntil: insuranceValidUntil.trim(),
      features: {
        comfort: linesToArray(comfortText),
        entertainment: linesToArray(entertainmentText),
        safety: linesToArray(safetyText),
        exterior: linesToArray(exteriorFeaturesText),
      },
      usageHistory,
      accidentHistory,
      serviceHistory: {
        lastServiceDate,
        lastServiceOdometerKm: lastServiceOdometerKm ? Number(lastServiceOdometerKm) : undefined,
        records: serviceRecords.filter((r) => r.date || r.summary || r.serviceCenter),
      },
      exteriorReport,
      interiorReport,
      mechanicalReport,
      tyreDetails,
      batteryDetails,
      documents,
    };

    try {
      const saved = car ? await updateCar(car.id, payload) : await createCar(payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save car listing.');
    } finally {
      setSaving(false);
    }
  }

  function updateReportRow(
    setter: React.Dispatch<React.SetStateAction<InspectionItem[]>>,
    idx: number,
    patch: Partial<InspectionItem>
  ) {
    setter((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-[#121215] text-slate-900 dark:text-white border border-slate-200 dark:border-white/[0.1] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] shrink-0">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              {car ? `Edit ${car.year} ${car.brand} ${car.model}` : 'Add New Showroom Listing'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Save as Draft anytime to complete inspection &amp; photos later.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] flex items-center justify-center text-slate-600 dark:text-zinc-300 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#09090B]/60 flex flex-wrap gap-1.5 shrink-0">
          {[
            { id: 'basic', label: '1. Basic & Pricing' },
            { id: 'gallery', label: `2. Photos (${gallery.length}/35)` },
            { id: 'specs', label: '3. Specs & Features' },
            { id: 'history', label: '4. Usage, Accident & Service' },
            { id: 'inspection', label: '5. Condition & Documents' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ModalTab)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-700 dark:bg-blue-600 text-white'
                  : 'bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'basic' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Porsche"
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Model *</label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="911 Carrera S"
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Variant</label>
                  <input
                    type="text"
                    value={variant}
                    onChange={(e) => setVariant(e.target.value)}
                    placeholder="992 Coupe PDK"
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Mfg. Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Reg. Year</label>
                  <input
                    type="number"
                    value={registrationYear}
                    onChange={(e) => setRegistrationYear(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Price (INR)</label>
                  <input
                    type="number"
                    min={0}
                    value={priceInr}
                    onChange={(e) => setPriceInr(e.target.value)}
                    placeholder="18800000"
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Pricing Mode</label>
                  <select
                    value={priceType}
                    onChange={(e) => setPriceType(e.target.value as PriceType)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  >
                    <option value="Negotiable">Negotiable</option>
                    <option value="Fixed">Fixed Price</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Kilometres</label>
                  <input
                    type="number"
                    min={0}
                    value={kilometres}
                    onChange={(e) => setKilometres(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Fuel Type</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value as FuelType)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Transmission</label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value as TransmissionType)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="PDK">PDK</option>
                    <option value="DCT">DCT</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CarStatus)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  >
                    <option value="Available">Available</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Sold">Sold</option>
                    <option value="Draft">Draft (Hidden)</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 h-10 px-3 w-full rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="accent-blue-700 dark:accent-blue-500 w-4 h-4"
                    />
                    <span className="text-xs font-medium text-slate-900 dark:text-white">Featured</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Ownership</label>
                  <input
                    type="text"
                    value={ownership}
                    onChange={(e) => setOwnership(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">City / Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Video Walkthrough URL (Optional)</label>
                  <input
                    type="text"
                    value={videoWalkthroughUrl}
                    onChange={(e) => setVideoWalkthroughUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    Warranty / Guarantee Period
                  </label>
                  <select
                    value={warrantyPeriod}
                    onChange={(e) => setWarrantyPeriod(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  >
                    <option value="6 Months">6 Months</option>
                    <option value="1 Year">1 Year</option>
                    <option value="2 Years">2 Years</option>
                    <option value="3 Years">3 Years</option>
                    <option value="No Warranty">No Warranty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    Guarantee Coverage Details
                  </label>
                  <input
                    type="text"
                    value={warrantyDetails}
                    onChange={(e) => setWarrantyDetails(e.target.value)}
                    placeholder="Engine, Gearbox, Electronics & 24×7 Roadside Assistance"
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Price Explanation (Optional)</label>
                  <input
                    type="text"
                    value={priceExplanation}
                    onChange={(e) => setPriceExplanation(e.target.value)}
                    placeholder="Includes PPF, Sport Chrono..."
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Market Comparison (Optional)</label>
                  <input
                    type="text"
                    value={marketComparisonNote}
                    onChange={(e) => setMarketComparisonNote(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Available Discount Note (Optional)</label>
                  <input
                    type="text"
                    value={discountNote}
                    onChange={(e) => setDiscountNote(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Vehicle Description</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Highlights (one per line)</label>
                  <textarea
                    rows={4}
                    value={highlightsText}
                    onChange={(e) => setHighlightsText(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-200 dark:border-white/[0.08]">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Seller / Dealer Name</label>
                  <input
                    type="text"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Seller Type</label>
                  <select
                    value={sellerType}
                    onChange={(e) => setSellerType(e.target.value as Car['sellerType'])}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  >
                    <option value="Certified Gallery">Certified Gallery</option>
                    <option value="Verified Partner Dealer">Verified Partner Dealer</option>
                    <option value="Private Consignment">Private Consignment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Seller Phone</label>
                  <input
                    type="text"
                    value={sellerPhone}
                    onChange={(e) => setSellerPhone(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">WhatsApp Digits</label>
                  <input
                    type="text"
                    value={sellerWhatsapp}
                    onChange={(e) => setSellerWhatsapp(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.08] space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Target Category</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value as PhotoCategory)}
                      className="w-full h-10 px-3 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                    >
                      {PHOTO_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Default Angle Label</label>
                    <input
                      type="text"
                      value={uploadAngleLabel}
                      onChange={(e) => setUploadAngleLabel(e.target.value)}
                      placeholder="e.g. Open Engine Bay, Odometer"
                      className="w-full h-10 px-3 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <label className="h-10 px-4 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer">
                    <ImagePlus className="w-4 h-4" />
                    <span>{uploading ? 'Uploading...' : 'Upload Vehicle Photos'}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="Or paste actual vehicle photo URL..."
                    className="flex-1 h-9 px-3 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-4 h-9 rounded-lg bg-slate-200 dark:bg-white/[0.08] hover:bg-slate-300 dark:hover:bg-white/[0.14] text-xs font-medium text-slate-900 dark:text-white cursor-pointer"
                  >
                    Add Photo URL
                  </button>
                </div>
              </div>

              {gallery.length === 0 ? (
                <div className="p-10 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.07] text-center text-xs text-slate-500 dark:text-zinc-400">
                  No photos uploaded for this vehicle yet. Upload up to 35 actual photographs across Exterior, Interior, Engine &amp; Mechanical, and Underbody &amp; Storage.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gallery.map((photo, idx) => (
                    <div
                      key={photo.id}
                      className="rounded-xl overflow-hidden bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] flex flex-col"
                    >
                      <div className="relative aspect-[4/3] bg-slate-100 dark:bg-[#18181B]">
                        <VehicleImage src={photo.url} alt={photo.angleLabel} className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-[11px] font-mono text-white">
                          {idx === 0 ? 'Primary Cover' : `#${idx + 1}`}
                        </span>
                      </div>
                      <div className="p-3 space-y-2">
                        <select
                          value={photo.category}
                          onChange={(e) =>
                            setGallery((prev) =>
                              prev.map((p, i) =>
                                i === idx ? { ...p, category: e.target.value as PhotoCategory } : p
                              )
                            )
                          }
                          className="w-full h-8 px-2 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                        >
                          {PHOTO_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={photo.angleLabel}
                          onChange={(e) =>
                            setGallery((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, angleLabel: e.target.value } : p))
                            )
                          }
                          placeholder="Angle label"
                          className="w-full h-8 px-2 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                        />
                        <div className="flex items-center justify-between pt-1">
                          {idx > 0 ? (
                            <button
                              type="button"
                              onClick={() => promotePrimary(idx)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-zinc-300 hover:text-blue-700 dark:hover:text-blue-400 cursor-pointer"
                            >
                              <ArrowUp className="w-3 h-3" />
                              <span>Set Primary</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold">Primary Photo</span>
                          )}
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            className="inline-flex items-center gap-1 text-[11px] text-rose-700 dark:text-red-400 hover:text-rose-800 dark:hover:text-red-300 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">First Reg. Date</label>
                  <input
                    type="date"
                    value={registrationDate}
                    onChange={(e) => setRegistrationDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Body Type</label>
                  <input
                    type="text"
                    value={bodyType}
                    onChange={(e) => setBodyType(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Exterior Colour</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Interior Colour</label>
                  <input
                    type="text"
                    value={interiorColor}
                    onChange={(e) => setInteriorColor(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    value={seatingCapacity}
                    onChange={(e) => setSeatingCapacity(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Doors</label>
                  <input
                    type="number"
                    value={doors}
                    onChange={(e) => setDoors(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Engine CC</label>
                  <input
                    type="text"
                    value={engineCc}
                    onChange={(e) => setEngineCc(e.target.value)}
                    placeholder="2,981 cc"
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Engine Type</label>
                  <input
                    type="text"
                    value={engine}
                    onChange={(e) => setEngine(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Cylinders</label>
                  <input
                    type="text"
                    value={cylinders}
                    onChange={(e) => setCylinders(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Max Power</label>
                  <input
                    type="text"
                    value={power}
                    onChange={(e) => setPower(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Max Torque</label>
                  <input
                    type="text"
                    value={torque}
                    onChange={(e) => setTorque(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Drivetrain</label>
                  <input
                    type="text"
                    value={drivetrain}
                    onChange={(e) => setDrivetrain(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Claimed Mileage</label>
                  <input
                    type="text"
                    value={claimedMileage}
                    onChange={(e) => setClaimedMileage(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Emission Standard</label>
                  <input
                    type="text"
                    value={emissionStandard}
                    onChange={(e) => setEmissionStandard(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Registration RTO</label>
                  <input
                    type="text"
                    value={registrationState}
                    onChange={(e) => setRegistrationState(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-white/[0.08]">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Comfort Features (one per line)</label>
                  <textarea
                    rows={4}
                    value={comfortText}
                    onChange={(e) => setComfortText(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Entertainment Features (one per line)</label>
                  <textarea
                    rows={4}
                    value={entertainmentText}
                    onChange={(e) => setEntertainmentText(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Safety Features (one per line)</label>
                  <textarea
                    rows={4}
                    value={safetyText}
                    onChange={(e) => setSafetyText(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Exterior Features (one per line)</label>
                  <textarea
                    rows={4}
                    value={exteriorFeaturesText}
                    onChange={(e) => setExteriorFeaturesText(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Usage & Ownership */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.08] space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Usage &amp; Ownership History</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-zinc-400 mb-1">Previous Owners</label>
                    <input
                      type="number"
                      min={0}
                      value={usageHistory.previousOwnersCount ?? 0}
                      onChange={(e) =>
                        setUsageHistory((u) => ({ ...u, previousOwnersCount: Number(e.target.value) }))
                      }
                      className="w-full h-9 px-3 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-zinc-400 mb-1">Usage Type</label>
                    <select
                      value={usageHistory.usageType}
                      onChange={(e) =>
                        setUsageHistory((u) => ({ ...u, usageType: e.target.value as UsageHistory['usageType'] }))
                      }
                      className="w-full h-9 px-3 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                    >
                      <option value="Personal">Personal</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Not Disclosed">Not Disclosed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-zinc-400 mb-1">Driving Pattern</label>
                    <select
                      value={usageHistory.drivingPattern}
                      onChange={(e) =>
                        setUsageHistory((u) => ({
                          ...u,
                          drivingPattern: e.target.value as UsageHistory['drivingPattern'],
                        }))
                      }
                      className="w-full h-9 px-3 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                    >
                      <option value="City & Highway">City &amp; Highway</option>
                      <option value="Mostly Highway">Mostly Highway</option>
                      <option value="Mostly City">Mostly City</option>
                      <option value="Not Disclosed">Not Disclosed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-zinc-400 mb-1">Record Source</label>
                    <select
                      value={usageHistory.recordVerification}
                      onChange={(e) =>
                        setUsageHistory((u) => ({
                          ...u,
                          recordVerification: e.target.value as UsageHistory['recordVerification'],
                        }))
                      }
                      className="w-full h-9 px-3 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                    >
                      <option value="Verified Service Records">Verified Service Records</option>
                      <option value="Seller Provided">Seller Provided</option>
                      <option value="Verification Pending">Verification Pending</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-zinc-400 mb-1">Reason for Selling</label>
                    <input
                      type="text"
                      value={usageHistory.reasonForSelling || ''}
                      onChange={(e) => setUsageHistory((u) => ({ ...u, reasonForSelling: e.target.value }))}
                      className="w-full h-9 px-3 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-zinc-400 mb-1">Registration History Note</label>
                    <input
                      type="text"
                      value={usageHistory.registrationHistoryNote || ''}
                      onChange={(e) => setUsageHistory((u) => ({ ...u, registrationHistoryNote: e.target.value }))}
                      className="w-full h-9 px-3 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Accident Disclosure */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.08] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Accident, Damage &amp; Repair Disclosure</h3>
                  <select
                    value={accidentHistory.overallStatus}
                    onChange={(e) =>
                      setAccidentHistory((a) => ({
                        ...a,
                        overallStatus: e.target.value as AccidentHistory['overallStatus'],
                      }))
                    }
                    className="h-9 px-3 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                  >
                    <option value="No Known Issues (Seller Declared)">No Known Issues (Seller Declared)</option>
                    <option value="Issues Disclosed">Issues Disclosed</option>
                    <option value="Not Disclosed">Not Disclosed</option>
                    <option value="Unknown">Unknown</option>
                    <option value="Independently Verified">Independently Verified</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'majorAccidents', label: 'Major Accidents' },
                    { key: 'minorAccidents', label: 'Minor Accidents' },
                    { key: 'repaintedPanels', label: 'Repainted Panels' },
                    { key: 'replacedParts', label: 'Replaced Parts' },
                    { key: 'floodDamage', label: 'Flood Damage' },
                    { key: 'structuralDamage', label: 'Structural Damage' },
                    { key: 'insuranceClaims', label: 'Insurance Claims' },
                    { key: 'majorMechanicalRepairs', label: 'Major Mechanical Repairs' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs text-slate-600 dark:text-zinc-400 mb-1">{field.label}</label>
                      <input
                        type="text"
                        value={(accidentHistory[field.key as keyof AccidentHistory] as string) || ''}
                        onChange={(e) =>
                          setAccidentHistory((a) => ({ ...a, [field.key]: e.target.value }))
                        }
                        className="w-full h-9 px-3 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Records */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.08] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Service &amp; Maintenance Records</h3>
                  <button
                    type="button"
                    onClick={addServiceRecord}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Service Log</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-zinc-400 mb-1">Last Service Date</label>
                    <input
                      type="date"
                      value={lastServiceDate}
                      onChange={(e) => setLastServiceDate(e.target.value)}
                      className="w-full h-9 px-3 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-zinc-400 mb-1">Last Service Odometer (km)</label>
                    <input
                      type="number"
                      value={lastServiceOdometerKm}
                      onChange={(e) => setLastServiceOdometerKm(e.target.value)}
                      className="w-full h-9 px-3 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                {serviceRecords.map((rec, idx) => (
                  <div key={rec.id} className="p-3 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="date"
                        value={rec.date}
                        onChange={(e) =>
                          setServiceRecords((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, date: e.target.value } : r))
                          )
                        }
                        className="h-8 px-2 rounded bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                      />
                      <input
                        type="number"
                        placeholder="Odometer km"
                        value={rec.odometerKm ?? ''}
                        onChange={(e) =>
                          setServiceRecords((prev) =>
                            prev.map((r, i) =>
                              i === idx
                                ? { ...r, odometerKm: e.target.value ? Number(e.target.value) : undefined }
                                : r
                            )
                          )
                        }
                        className="h-8 px-2 rounded bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Service Centre Name"
                        value={rec.serviceCenter}
                        onChange={(e) =>
                          setServiceRecords((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, serviceCenter: e.target.value } : r))
                          )
                        }
                        className="h-8 px-2 rounded bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Summary of oil, brakes, filters, tyres, repairs..."
                        value={rec.summary}
                        onChange={(e) =>
                          setServiceRecords((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, summary: e.target.value } : r))
                          )
                        }
                        className="flex-1 h-8 px-2 rounded bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setServiceRecords((prev) => prev.filter((_, i) => i !== idx))}
                        className="px-2.5 h-8 rounded bg-rose-50 dark:bg-red-500/15 text-rose-700 dark:text-red-400 text-xs cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'inspection' && (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'exterior', label: 'Exterior (19)' },
                  { id: 'interior', label: 'Interior (17)' },
                  { id: 'mechanical', label: 'Mechanical (14)' },
                  { id: 'tyres', label: 'Tyres & Battery' },
                  { id: 'docs', label: 'Documents (9)' },
                ].map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setInspectionSubTab(sub.id as typeof inspectionSubTab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      inspectionSubTab === sub.id
                        ? 'bg-blue-700 dark:bg-white/[0.14] text-white'
                        : 'bg-slate-100 dark:bg-[#09090B] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {(inspectionSubTab === 'exterior' ||
                inspectionSubTab === 'interior' ||
                inspectionSubTab === 'mechanical') && (
                <div className="space-y-2.5">
                  {(inspectionSubTab === 'exterior'
                    ? exteriorReport
                    : inspectionSubTab === 'interior'
                    ? interiorReport
                    : mechanicalReport
                  ).map((row, idx) => {
                    const setter =
                      inspectionSubTab === 'exterior'
                        ? setExteriorReport
                        : inspectionSubTab === 'interior'
                        ? setInteriorReport
                        : setMechanicalReport;
                    return (
                      <div
                        key={row.component}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.07] items-center"
                      >
                        <span className="sm:col-span-3 text-xs font-medium text-slate-900 dark:text-white">{row.component}</span>
                        <select
                          value={row.status}
                          onChange={(e) =>
                            updateReportRow(setter, idx, { status: e.target.value as InspectionCondition })
                          }
                          className="sm:col-span-3 h-8 px-2 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                        >
                          <option value="Excellent">Excellent</option>
                          <option value="Good">Good</option>
                          <option value="Average">Average</option>
                          <option value="Needs Attention">Needs Attention</option>
                          <option value="Not Inspected">Not Inspected</option>
                        </select>
                        <input
                          type="text"
                          value={row.notes || ''}
                          onChange={(e) => updateReportRow(setter, idx, { notes: e.target.value })}
                          placeholder="Inspection remarks..."
                          className="sm:col-span-6 h-8 px-2.5 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {inspectionSubTab === 'tyres' && (
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    {tyreDetails.map((tyre, idx) => (
                      <div
                        key={tyre.position}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.07] items-center"
                      >
                        <span className="sm:col-span-2 text-xs font-semibold text-slate-900 dark:text-white">{tyre.position}</span>
                        <input
                          type="text"
                          placeholder="Brand (e.g. Michelin)"
                          value={tyre.brand || ''}
                          onChange={(e) =>
                            setTyreDetails((prev) =>
                              prev.map((t, i) => (i === idx ? { ...t, brand: e.target.value } : t))
                            )
                          }
                          className="sm:col-span-3 h-8 px-2 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                        />
                        <input
                          type="text"
                          placeholder="Tread condition"
                          value={tyre.treadCondition}
                          onChange={(e) =>
                            setTyreDetails((prev) =>
                              prev.map((t, i) => (i === idx ? { ...t, treadCondition: e.target.value } : t))
                            )
                          }
                          className="sm:col-span-3 h-8 px-2 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                        />
                        <input
                          type="text"
                          placeholder="Replacement note"
                          value={tyre.replacementNote || ''}
                          onChange={(e) =>
                            setTyreDetails((prev) =>
                              prev.map((t, i) => (i === idx ? { ...t, replacementNote: e.target.value } : t))
                            )
                          }
                          className="sm:col-span-4 h-8 px-2 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Battery Brand"
                      value={batteryDetails.brand || ''}
                      onChange={(e) => setBatteryDetails((b) => ({ ...b, brand: e.target.value }))}
                      className="h-9 px-3 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Battery Age"
                      value={batteryDetails.age || ''}
                      onChange={(e) => setBatteryDetails((b) => ({ ...b, age: e.target.value }))}
                      className="h-9 px-3 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Battery Condition"
                      value={batteryDetails.condition}
                      onChange={(e) => setBatteryDetails((b) => ({ ...b, condition: e.target.value }))}
                      className="h-9 px-3 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Replacement History"
                      value={batteryDetails.replacementHistory || ''}
                      onChange={(e) => setBatteryDetails((b) => ({ ...b, replacementHistory: e.target.value }))}
                      className="h-9 px-3 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {inspectionSubTab === 'docs' && (
                <div className="space-y-2.5">
                  {documents.map((doc, idx) => (
                    <div
                      key={doc.key}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.07] items-center"
                    >
                      <span className="sm:col-span-4 text-xs font-medium text-slate-900 dark:text-white">{doc.label}</span>
                      <select
                        value={doc.status}
                        onChange={(e) =>
                          setDocuments((prev) =>
                            prev.map((d, i) =>
                              i === idx ? { ...d, status: e.target.value as DocumentStatus } : d
                            )
                          )
                        }
                        className="sm:col-span-3 h-8 px-2 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                      >
                        <option value="Verified">Verified</option>
                        <option value="Seller Provided">Seller Provided</option>
                        <option value="Not Verified">Not Verified</option>
                        <option value="Expired">Expired</option>
                        <option value="Not Available">Not Available</option>
                      </select>
                      <input
                        type="text"
                        value={doc.note || ''}
                        onChange={(e) =>
                          setDocuments((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, note: e.target.value } : d))
                          )
                        }
                        placeholder="Public note (no private IDs)"
                        className="sm:col-span-5 h-8 px-2.5 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && <p className="text-xs font-medium text-rose-700 dark:text-red-400">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-sm font-medium text-slate-700 dark:text-zinc-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-60 text-sm font-semibold text-white cursor-pointer"
            >
              {saving ? 'Saving...' : status === 'Draft' ? 'Save Draft Listing' : car ? 'Update Listing' : 'Publish Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
