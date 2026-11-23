import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Cloud,
  ImagePlus,
  Link2,
  Loader2,
  Plus,
  Star,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
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
import { createCar, fetchBrands, fetchCloudinaryStatus, updateCar, uploadCarImages } from '../utils/api';
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

type ModalTab = 'basic' | 'gallery';

const PHOTO_CATEGORIES: PhotoCategory[] = [
  'Exterior',
  'Interior',
  'Engine & Mechanical',
  'Underbody & Storage',
];

const POPULAR_BRANDS = [
  'Maruti Suzuki',
  'Hyundai',
  'Tata',
  'Mahindra',
  'Toyota',
  'Kia',
  'MG',
  'Honda',
  'Volkswagen',
  'Skoda',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Porsche',
  'Land Rover',
  'Range Rover',
  'Jaguar',
  'Volvo',
  'Jeep',
  'Mini',
  'Renault',
  'Nissan',
  'Citroen',
  'Force Motors',
  'Lexus',
  'BYD',
  'Aston Martin',
  'Bentley',
  'Rolls-Royce',
  'Ferrari',
  'Lamborghini',
  'Maserati',
  'McLaren',
  'Tesla',
];

export function AdminCarModal({ car, open, onClose, onSaved }: AdminCarModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('basic');
  const [availableBrands, setAvailableBrands] = useState<string[]>(POPULAR_BRANDS);
  const [isCustomBrand, setIsCustomBrand] = useState(false);

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

  // Categorized Gallery (up to 70 photos)
  const [gallery, setGallery] = useState<CarPhoto[]>([]);
  const [uploadCategory, setUploadCategory] = useState<PhotoCategory>('Exterior');
  const [uploadAngleLabel, setUploadAngleLabel] = useState('Front-Left 45° View');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<{
    configured: boolean;
    connected: boolean;
    cloudName: string;
    error?: string;
  } | null>(null);

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
  const [insuranceValidUntil, setInsuranceValidUntil] = useState('Comprehensive (Valid)');
  const [rcNote, setRcNote] = useState('Original (Verified)');
  const [keysNote, setKeysNote] = useState('2 Original Keys');
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (fieldName: string) => {
    setFieldErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const copy = { ...prev };
      delete copy[fieldName];
      return copy;
    });
  };

  const hasTabError = (tabId: ModalTab): boolean => {
    if (tabId === 'basic') {
      return Boolean(fieldErrors.brand || fieldErrors.model || fieldErrors.priceInr || fieldErrors.year || fieldErrors.kilometres);
    }
    return false;
  };

  const getInputClass = (fieldName: string, isMono = false) => {
    const hasErr = Boolean(fieldErrors[fieldName]);
    return `w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border text-sm text-slate-900 dark:text-white ${
      isMono ? 'font-mono' : ''
    } transition-all duration-200 focus:outline-none ${
      hasErr
        ? 'border-rose-500 dark:border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5 dark:bg-rose-500/10 focus:border-rose-500 focus:ring-rose-500'
        : 'border-slate-200 dark:border-white/[0.1] focus:border-blue-600 dark:focus:border-blue-500'
    }`;
  };

  useEffect(() => {
    if (open) {
      fetchBrands()
        .then((brandList) => {
          if (Array.isArray(brandList) && brandList.length > 0) {
            const names = brandList.map((b) => b.name).filter(Boolean);
            setAvailableBrands((prev) => {
              const lower = new Set(prev.map((p) => p.toLowerCase()));
              const added = names.filter((n) => !lower.has(n.toLowerCase()));
              return [...prev, ...added];
            });
          }
        })
        .catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setActiveTab('basic');
    setError('');
    setFieldErrors({});

    if (car) {
      const currentBrand = (car.brand || '').trim();
      const matched = availableBrands.find(
        (b) => b.toLowerCase() === currentBrand.toLowerCase()
      );
      if (matched) {
        setBrand(matched);
        setIsCustomBrand(false);
      } else if (currentBrand) {
        setBrand(currentBrand);
        setIsCustomBrand(true);
      } else {
        setBrand('');
        setIsCustomBrand(false);
      }
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
      setInsuranceValidUntil(car.insuranceValidUntil || 'Comprehensive (Valid)');
      const rcDoc = car.documents?.find((d) => d.key === 'rc');
      setRcNote(rcDoc?.note || (rcDoc?.status ? `Original (${rcDoc.status})` : 'Original (Verified)'));
      const keysDoc = car.documents?.find((d) => d.key === 'keys');
      setKeysNote(keysDoc?.note || (car.engine ? `${car.engine} · 2 Original Keys` : '2 Original Keys'));
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
      setIsCustomBrand(false);
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
      setInsuranceValidUntil('Comprehensive (Valid)');
      setRcNote('Original (Verified)');
      setKeysNote('2 Original Keys');
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

    if (open) {
      fetchCloudinaryStatus()
        .then((st) => setCloudStatus(st))
        .catch(() => {});
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
    if (gallery.length + fileList.length > 70) {
      setError('Maximum 70 photographs allowed per vehicle listing.');
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
    if (gallery.length >= 70) {
      setError('Maximum 70 photographs allowed per vehicle.');
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

  function movePhoto(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= gallery.length || fromIndex === toIndex) return;
    setGallery((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next.map((p, idx) => ({ ...p, order: idx }));
    });
  }

  function promotePrimary(index: number) {
    movePhoto(index, 0);
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
    const errors: Record<string, string> = {};

    if (!brand.trim()) {
      errors.brand = 'Brand name is required (e.g. Porsche, BMW)';
    }
    if (!model.trim()) {
      errors.model = 'Model is required (e.g. 911 Carrera S, M4)';
    }
    if (!year || Number(year) < 1980 || Number(year) > 2030) {
      errors.year = 'Please enter a valid Manufacturing Year (e.g. 2022)';
    }
    if (!isDraft && (!priceInr || Number(priceInr) <= 0)) {
      errors.priceInr = 'Price in INR is required, or save listing as Draft';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstKey = Object.keys(errors)[0];
      setError(errors[firstKey]);

      if (['brand', 'model', 'variant', 'year', 'registrationYear', 'priceInr', 'priceType', 'kilometres'].includes(firstKey)) {
        setActiveTab('basic');
      }

      setTimeout(() => {
        const targetId = firstKey === 'brand' && isCustomBrand ? 'field-brand-custom' : `field-${firstKey}`;
        const el = document.getElementById(targetId) || document.getElementById(`field-${firstKey}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
      }, 60);
      return;
    }

    setFieldErrors({});
    setSaving(true);

    const updatedDocs = [...documents];
    const updateOrAddDoc = (key: string, label: string, note: string) => {
      const idx = updatedDocs.findIndex((d) => d.key === key);
      const item: DocumentItem = {
        key,
        label,
        status: 'Verified',
        note: note.trim() || `${label} Verified`,
      };
      if (idx >= 0) {
        updatedDocs[idx] = { ...updatedDocs[idx], status: 'Verified', note: item.note };
      } else {
        updatedDocs.push(item);
      }
    };

    updateOrAddDoc('rc', 'Registration Certificate (RC)', rcNote);
    updateOrAddDoc('insurance', 'Comprehensive Insurance', insuranceValidUntil);
    updateOrAddDoc('keys', 'Original & Spare Keys', keysNote);

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
      documents: updatedDocs,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[94vh] flex flex-col rounded-2xl bg-white dark:bg-[#121215] text-slate-900 dark:text-white border border-slate-200 dark:border-white/[0.1] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-white/[0.08] shrink-0">
          <div className="min-w-0 pr-2">
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
              {car ? `Edit ${car.year} ${car.brand} ${car.model}` : 'Add New Showroom Listing'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
              Save as Draft anytime to complete inspection &amp; photos later.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] flex items-center justify-center text-slate-600 dark:text-zinc-300 cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="px-3.5 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#09090B]/60 flex flex-wrap gap-1.5 shrink-0">
          {[
            { id: 'basic', label: '1. Basic & Pricing' },
            { id: 'gallery', label: `2. Photos (${gallery.length}/70)` },
          ].map((tab) => {
            const hasErr = hasTabError(tab.id as ModalTab);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ModalTab)}
                className={`relative px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? hasErr
                      ? 'bg-rose-600 text-white'
                      : 'bg-blue-700 dark:bg-blue-600 text-white'
                    : hasErr
                    ? 'bg-rose-500/10 border border-rose-500/60 text-rose-600 dark:text-rose-400'
                    : 'bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {hasErr && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse inline-block" />
                )}
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
          {activeTab === 'basic' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                      Brand <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isCustomBrand;
                        setIsCustomBrand(next);
                        if (next) {
                          setTimeout(() => document.getElementById('field-brand-custom')?.focus(), 50);
                        } else {
                          const matched = availableBrands.find(
                            (b) => b.toLowerCase() === brand.trim().toLowerCase()
                          );
                          setBrand(matched || '');
                        }
                      }}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {isCustomBrand ? '📋 Choose from List' : '✏️ Custom Brand'}
                    </button>
                  </div>

                  {/* Brand Selector Dropdown */}
                  <select
                    id="field-brand"
                    value={isCustomBrand ? '__custom__' : (brand || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__custom__') {
                        setIsCustomBrand(true);
                        setBrand('');
                        setTimeout(() => document.getElementById('field-brand-custom')?.focus(), 50);
                      } else {
                        setIsCustomBrand(false);
                        setBrand(val);
                        clearFieldError('brand');
                      }
                    }}
                    className={getInputClass('brand')}
                  >
                    <option value="">-- Select Brand --</option>
                    {availableBrands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                    <option value="__custom__">✏️ Custom / Other Brand (Type Manually)...</option>
                  </select>

                  {/* Custom Brand Text Input (shown if Custom Brand is chosen) */}
                  {isCustomBrand && (
                    <div className="mt-2 space-y-1">
                      <input
                        id="field-brand-custom"
                        type="text"
                        value={brand}
                        onChange={(e) => {
                          setBrand(e.target.value);
                          clearFieldError('brand');
                        }}
                        placeholder="Type custom brand (e.g. Mg, Lotus, Pagani)"
                        className={getInputClass('brand')}
                        autoFocus
                      />
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        Type any custom brand name if it's not in the list.
                      </p>
                    </div>
                  )}

                  {fieldErrors.brand && (
                    <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{fieldErrors.brand}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    Model <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="field-model"
                    type="text"
                    value={model}
                    onChange={(e) => {
                      setModel(e.target.value);
                      clearFieldError('model');
                    }}
                    placeholder="911 Carrera S"
                    className={getInputClass('model')}
                  />
                  {fieldErrors.model && (
                    <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{fieldErrors.model}</span>
                    </p>
                  )}
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    Mfg. Year <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="field-year"
                    type="number"
                    value={year}
                    onChange={(e) => {
                      setYear(e.target.value);
                      clearFieldError('year');
                    }}
                    className={getInputClass('year', true)}
                  />
                  {fieldErrors.year && (
                    <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{fieldErrors.year}</span>
                    </p>
                  )}
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
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    Price (INR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="field-priceInr"
                    type="number"
                    min={0}
                    value={priceInr}
                    onChange={(e) => {
                      setPriceInr(e.target.value);
                      clearFieldError('priceInr');
                    }}
                    placeholder="18800000"
                    className={getInputClass('priceInr', true)}
                  />
                  {fieldErrors.priceInr && (
                    <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{fieldErrors.priceInr}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Kilometres</label>
                  <input
                    id="field-kilometres"
                    type="number"
                    min={0}
                    value={kilometres}
                    onChange={(e) => {
                      setKilometres(e.target.value);
                      clearFieldError('kilometres');
                    }}
                    className={getInputClass('kilometres', true)}
                  />
                  {fieldErrors.kilometres && (
                    <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{fieldErrors.kilometres}</span>
                    </p>
                  )}
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

              {/* RTO, RC, Comprehensive Insurance & Engine / Keys Card */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.08] space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    RTO, Registration (RC), Insurance &amp; Engine / Keys
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Official Verification Details
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                      Registration RTO
                    </label>
                    <input
                      type="text"
                      value={registrationState}
                      onChange={(e) => setRegistrationState(e.target.value)}
                      placeholder="e.g. MH-02 (Mumbai), DL-03, HR-26"
                      className="w-full h-10 px-3 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                      Registration Certificate (RC)
                    </label>
                    <input
                      type="text"
                      value={rcNote}
                      onChange={(e) => setRcNote(e.target.value)}
                      placeholder="e.g. Original (Verified), Available"
                      className="w-full h-10 px-3 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                      Comprehensive Insurance
                    </label>
                    <input
                      type="text"
                      value={insuranceValidUntil}
                      onChange={(e) => setInsuranceValidUntil(e.target.value)}
                      placeholder="e.g. Comprehensive (Valid till Dec 2026)"
                      className="w-full h-10 px-3 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                      Engine &amp; Keys
                    </label>
                    <input
                      type="text"
                      value={keysNote}
                      onChange={(e) => setKeysNote(e.target.value)}
                      placeholder="e.g. 2 Original Keys · 2.0L Turbo Engine"
                      className="w-full h-10 px-3 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                    />
                  </div>
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
              {/* Storage Destination Status Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">Photo Storage:</span>
                  {cloudStatus?.connected ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Cloudinary CDN Active ({cloudStatus.cloudName})
                    </span>
                  ) : cloudStatus?.configured ? (
                    <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-md" title={cloudStatus.error}>
                      <AlertCircle className="w-3.5 h-3.5" /> Cloud Name Issue ({cloudStatus.cloudName}) - Auto-saving to Local Disk
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-600 dark:text-zinc-400 font-medium bg-slate-200/60 dark:bg-white/[0.06] px-2 py-0.5 rounded-md">
                      Local Server Storage Active
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                  {gallery.length}/70 Photographs
                </span>
              </div>

              {/* Large Direct Device Gallery Upload Dropzone */}
              <label
                className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group ${
                  uploading
                    ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 opacity-80 cursor-wait'
                    : 'border-slate-300 dark:border-white/15 hover:border-amber-500 dark:hover:border-amber-500 bg-slate-50/80 dark:bg-[#0E1524]/60 hover:bg-amber-50/30 dark:hover:bg-[#131D31]'
                }`}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                  {uploading ? (
                    <Loader2 className="w-7 h-7 animate-spin" />
                  ) : (
                    <UploadCloud className="w-7 h-7" />
                  )}
                </div>
                <p className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {uploading ? 'Uploading Photographs from Gallery...' : 'Upload Photos from Device Gallery'}
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md">
                  Click here to open your phone/PC gallery. Select single or multiple photos at once.
                </p>
                <span className="mt-3.5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-amber-600/20">
                  <ImagePlus className="w-4 h-4" />
                  <span>Choose from Gallery ({gallery.length}/70)</span>
                </span>
              </label>

              {/* Upload Presets & Optional URL Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.08]">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">Category for new photos:</span>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value as PhotoCategory)}
                      className="h-8 px-2.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      {PHOTO_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">Angle label:</span>
                    <input
                      type="text"
                      value={uploadAngleLabel}
                      onChange={(e) => setUploadAngleLabel(e.target.value)}
                      placeholder="e.g. Front 3/4, Cockpit"
                      className="h-8 px-2.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white w-44"
                    />
                  </div>
                </div>

                {/* Optional Collapsible Web URL Link */}
                <button
                  type="button"
                  onClick={() => setShowUrlInput((prev) => !prev)}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>{showUrlInput ? 'Hide URL link input' : 'Or paste web link (Optional)'}</span>
                </button>
              </div>

              {/* Collapsible Photo URL Field */}
              {showUrlInput && (
                <div className="flex gap-2 p-3 rounded-xl bg-slate-100/60 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06]">
                  <input
                    type="text"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="flex-1 h-9 px-3 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-4 h-9 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
                  >
                    Add URL
                  </button>
                </div>
              )}

              {gallery.length === 0 ? (
                <div className="p-10 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.07] text-center text-xs text-slate-500 dark:text-zinc-400">
                  No photos uploaded for this vehicle yet. Upload up to 70 actual photographs across Exterior, Interior, Engine &amp; Mechanical, and Underbody &amp; Storage.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gallery.map((photo, idx) => (
                    <div
                      key={photo.id}
                      className={`rounded-xl overflow-hidden bg-slate-50 dark:bg-[#09090B] border transition-all flex flex-col ${
                        idx === 0
                          ? 'border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                          : 'border-slate-200 dark:border-white/[0.1]'
                      }`}
                    >
                      {/* Photo Thumbnail - 100% Uncropped with Ambient Backdrop */}
                      <div className="relative aspect-[4/3] bg-black/90 overflow-hidden flex items-center justify-center">
                        <VehicleImage
                          src={photo.url}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 w-full h-full object-cover blur-lg opacity-35 scale-110 pointer-events-none"
                        />
                        <VehicleImage
                          src={photo.url}
                          alt={photo.angleLabel}
                          className="relative z-10 max-w-full max-h-full w-auto h-auto object-contain object-center drop-shadow-md"
                        />
                        {/* Position Badge */}
                        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-1 shadow ${
                              idx === 0
                                ? 'bg-amber-500 text-black'
                                : 'bg-black/80 text-white border border-white/20'
                            }`}
                          >
                            {idx === 0 ? (
                              <>
                                <Star className="w-3 h-3 fill-black text-black" />
                                #1 Cover
                              </>
                            ) : (
                              `#${idx + 1}`
                            )}
                          </span>
                        </div>

                        {/* Direct Reorder Buttons on Overlay */}
                        <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-black/80 backdrop-blur-sm p-1 rounded-lg border border-white/20">
                          <button
                            type="button"
                            title="Move Left (Earlier in sequence)"
                            disabled={idx === 0}
                            onClick={() => movePhoto(idx, idx - 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 cursor-pointer"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Move Right (Later in sequence)"
                            disabled={idx === gallery.length - 1}
                            onClick={() => movePhoto(idx, idx + 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 cursor-pointer"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-3 space-y-2.5">
                        {/* Order Selector Dropdown */}
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                            Sequence Position:
                          </label>
                          <select
                            value={idx + 1}
                            onChange={(e) => movePhoto(idx, Number(e.target.value) - 1)}
                            className="h-7 px-2 rounded bg-white dark:bg-[#121215] border border-slate-300 dark:border-white/[0.15] text-xs font-mono font-semibold text-slate-900 dark:text-white cursor-pointer"
                          >
                            {gallery.map((_, i) => (
                              <option key={i} value={i + 1}>
                                {i === 0 ? '1 (Primary Cover)' : `Position ${i + 1}`}
                              </option>
                            ))}
                          </select>
                        </div>

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
                          placeholder="Angle label (e.g. Front 3/4, Cockpit, Rear)"
                          className="w-full h-8 px-2 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                        />

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-white/[0.06]">
                          {idx > 0 ? (
                            <button
                              type="button"
                              onClick={() => promotePrimary(idx)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                            >
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>Make #1 Cover</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-amber-500 font-bold flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-500" /> Primary Cover Image
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 hover:text-rose-700 cursor-pointer"
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

          {error && (
            <div className="flex items-center gap-2.5 p-3 sm:p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-slate-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-sm font-medium text-slate-700 dark:text-zinc-200 cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-60 text-sm font-semibold text-white cursor-pointer text-center"
            >
              {saving ? 'Saving...' : status === 'Draft' ? 'Save Draft Listing' : car ? 'Update Listing' : 'Publish Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
