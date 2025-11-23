import React, { useState, useEffect } from 'react';
import { Album, AppStep, Photo, AlbumPage, THEME_COLORS } from './types';
import { StepWizard } from './components/StepWizard';
import { PhotoUpload } from './components/PhotoUpload';
import { PhotoStandardizer } from './components/PhotoStandardizer';
import { generateCoverImage, refineText } from './services/gemini';
import { Wand2, Layout, Type, Download, Loader2, Sparkles, BookOpen } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.DETAILS);
  const [loading, setLoading] = useState(false);
  const [rawPhotos, setRawPhotos] = useState<Photo[]>([]); // Staging area for photos before album creation
  const [album, setAlbum] = useState<Album>({
    id: '1',
    title: '',
    date: new Date().getFullYear().toString(),
    themeColor: THEME_COLORS[0].hex,
    pages: [],
  });

  // --- Handlers ---

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAlbum({ ...album, title: e.target.value });
  };

  const handleThemeSelect = (hex: string) => {
    setAlbum({ ...album, themeColor: hex });
  };

  // 1. User uploads photos -> Goes to RawPhotos state
  const handlePhotoUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newPhotos: Photo[] = Array.from(files).map((file) => {
      const url = URL.createObjectURL(file);
      return {
        id: Math.random().toString(36).substr(2, 9),
        url: url,
        originalUrl: url,
        file: file,
        layoutPreference: 'half'
      };
    });

    setRawPhotos(prev => [...prev, ...newPhotos]);
  };

  // 2. User crops/updates a raw photo
  const handleUpdateRawPhoto = (id: string, newUrl: string) => {
    setRawPhotos(prev => prev.map(p => p.id === id ? { ...p, url: newUrl } : p));
  };

  // 3. Bulk update photos (from Auto Standardizer)
  const handleBulkUpdatePhotos = (updates: { id: string; url: string }[]) => {
    setRawPhotos(prev => prev.map(p => {
      const update = updates.find(u => u.id === p.id);
      return update ? { ...p, url: update.url } : p;
    }));
  };

  // 4. User finishes standardization -> Generates Album Pages
  const handleFinishStandardization = () => {
    // Simple "Smart Grouping" Logic: Group by 4
    const newPages: AlbumPage[] = [];
    for (let i = 0; i < rawPhotos.length; i += 4) {
      newPages.push({
        id: Math.random().toString(36).substr(2, 9),
        photos: rawPhotos.slice(i, i + 4),
        layout: 'grid',
        anecdote: ''
      });
    }

    setAlbum(prev => ({ ...prev, pages: newPages }));
    setCurrentStep(AppStep.EDIT);
  };

  const handleAnecdoteChange = (pageId: string, text: string) => {
    setAlbum(prev => ({
      ...prev,
      pages: prev.pages.map(p => p.id === pageId ? { ...p, anecdote: text } : p)
    }));
  };

  const handleRefineText = async (pageId: string, currentText: string) => {
    if (!currentText) return;
    setLoading(true);
    try {
      const refined = await refineText(currentText);
      handleAnecdoteChange(pageId, refined);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCover = async () => {
    if (!album.title) return;
    setLoading(true);
    try {
      const coverUrl = await generateCoverImage(album.title, album.themeColor);
      if (coverUrl) {
        setAlbum(prev => ({ ...prev, coverImage: coverUrl }));
      }
    } catch (e) {
      alert("Error generating cover. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Render Steps ---

  const renderDetails = () => (
    <div className="flex flex-col items-center space-y-8 animate-fade-in max-w-xl mx-auto text-center">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-800">Crea tu Historia</h1>
        <p className="text-gray-500">Comienza dándole un nombre a tu aventura.</p>
      </div>
      
      <div className="w-full space-y-6">
        <div className="text-left">
          <label className="block text-sm font-medium text-gray-700 mb-1">Título del Álbum</label>
          <input
            type="text"
            value={album.title}
            onChange={handleTitleChange}
            placeholder="Ej. Verano en Italia 2024"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-pink focus:border-transparent outline-none transition text-lg bg-white text-gray-900 placeholder-gray-400"
          />
        </div>

        <div className="text-left">
          <label className="block text-sm font-medium text-gray-700 mb-2">Estilo & Color</label>
          <div className="flex space-x-4 justify-center">
            {THEME_COLORS.map((color) => (
              <button
                key={color.name}
                onClick={() => handleThemeSelect(color.hex)}
                className={`w-12 h-12 rounded-full border-4 transition-transform hover:scale-110 ${album.themeColor === color.hex ? 'border-gray-800 scale-110' : 'border-white shadow-md'}`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        <button
          disabled={!album.title}
          onClick={() => setCurrentStep(AppStep.UPLOAD)}
          className="w-full py-4 bg-gray-900 text-white rounded-lg font-medium text-lg disabled:opacity-50 hover:bg-gray-800 transition-all shadow-lg"
        >
          Continuar
        </button>
      </div>
    </div>
  );

  const renderUpload = () => (
    <div className="flex flex-col items-center space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-serif font-bold">Sube tus Recuerdos</h2>
        <p className="text-gray-500 mt-2">Agrega fotos para comenzar a diseñar.</p>
      </div>
      <PhotoUpload 
        onUpload={handlePhotoUpload} 
        photoCount={rawPhotos.length}
      />
      {rawPhotos.length > 0 && (
        <button
          onClick={() => setCurrentStep(AppStep.STANDARDIZE)}
          className="px-8 py-3 bg-brand-pink text-white rounded-full font-medium shadow-md hover:bg-opacity-90 transition-all"
        >
          Siguiente: Revisar Fotos
        </button>
      )}
    </div>
  );

  const renderStandardize = () => (
    <PhotoStandardizer 
      photos={rawPhotos}
      onUpdatePhoto={handleUpdateRawPhoto}
      onUpdatePhotos={handleBulkUpdatePhotos}
      onComplete={handleFinishStandardization}
    />
  );

  const renderEdit = () => (
    <div className="w-full space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif font-bold">Edita tu Historia</h2>
        <button
           onClick={() => setCurrentStep(AppStep.COVER)}
           className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          Siguiente: Portada
        </button>
      </div>

      <div className="grid gap-12">
        {album.pages.map((page, index) => (
          <div 
            key={page.id} 
            className="p-8 shadow-sm border border-gray-100 rounded-xl relative transition-colors duration-500"
            style={{ backgroundColor: `${album.themeColor}15` }} // 15 = ~8% opacity hex
          >
            <span className="absolute -top-3 -left-3 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm z-10">
              {index + 1}
            </span>
            
            {/* Layout Grid */}
            <div className={`grid gap-4 mb-6 ${page.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {page.photos.map(photo => (
                <div key={photo.id} className="aspect-square overflow-hidden rounded-md shadow-sm bg-white p-2">
                  <img src={photo.url} alt="Memory" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>

            {/* Anecdote Section */}
            <div className="relative">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Anécdota</label>
              <textarea
                value={page.anecdote}
                onChange={(e) => handleAnecdoteChange(page.id, e.target.value)}
                placeholder="Escribe algo sobre este momento..."
                className="w-full p-3 bg-white/60 backdrop-blur-sm rounded-lg text-gray-700 font-serif border border-transparent focus:border-brand-pink focus:ring-0 resize-none h-24 shadow-inner"
              />
              {page.anecdote && (
                <button
                  onClick={() => handleRefineText(page.id, page.anecdote || '')}
                  disabled={loading}
                  className="absolute bottom-2 right-2 text-xs bg-white border border-gray-200 px-2 py-1 rounded-md text-purple-600 flex items-center hover:bg-purple-50 transition-colors shadow-sm"
                >
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                  Mejorar con AI
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCover = () => (
    <div className="flex flex-col items-center space-y-8 max-w-4xl mx-auto">
       <div className="text-center space-y-2">
        <h2 className="text-3xl font-serif font-bold">Diseña la Portada</h2>
        <p className="text-gray-500">Usa nuestra IA para generar el arte y nosotros ponemos el estilo.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 w-full items-start">
        {/* Controls */}
        <div className="w-full md:w-1/3 space-y-6 bg-white p-6 rounded-xl border border-gray-200">
          <div>
            <label className="text-sm text-gray-500 block mb-1">Título</label>
            <p className="font-bold text-lg">{album.title}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1">Tema</label>
            <div className="w-8 h-8 rounded-full border shadow-sm" style={{ backgroundColor: album.themeColor }}></div>
          </div>
          <button
            onClick={handleGenerateCover}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex justify-center items-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Creando Arte...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                Generar Fondo con IA
              </>
            )}
          </button>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Powered by Gemini 2.5 Flash Image
          </p>
        </div>

        {/* Preview */}
        <div className="w-full md:w-2/3 flex justify-center bg-gray-100 p-8 rounded-xl min-h-[500px] items-center">
          {album.coverImage ? (
            <div className="relative group perspective-1000">
              <div 
                className="w-[300px] h-[400px] bg-white shadow-2xl relative transform transition-transform duration-500 group-hover:rotate-y-12 overflow-hidden flex flex-col justify-between"
                style={{ 
                  backgroundColor: album.themeColor
                }}
              >
                 {/* Background Image Layer */}
                 <div 
                    className="absolute inset-0 z-0"
                    style={{ 
                      backgroundImage: `url(${album.coverImage})`, 
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                 />

                 {/* Gradient Overlay for Text Readability */}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 z-10"></div>
                 
                 {/* Top Decor */}
                 <div className="relative z-20 p-6 flex justify-between items-center text-white/80">
                    <span className="text-xs tracking-[0.2em] uppercase font-bold">TRAVEL MEMOIRS</span>
                    <span className="text-xs font-serif italic">{album.date}</span>
                 </div>

                 {/* Spine/Fold Effect */}
                 <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-white/30 to-transparent z-30 mix-blend-overlay"></div>

                 {/* Main Title Typography */}
                 <div className="relative z-20 p-6 pt-0 mt-auto">
                    <h1 className="text-5xl font-display text-white uppercase leading-none tracking-tight drop-shadow-xl text-center">
                      {album.title}
                    </h1>
                 </div>
              </div>
              
              <button 
                className="mt-8 mx-auto block px-6 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors"
                onClick={() => setCurrentStep(AppStep.PREVIEW)}
              >
                Ver Álbum Completo
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <div className="w-[300px] h-[400px] border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white/50">
                <span className="text-sm">La portada aparecerá aquí</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-between w-full max-w-4xl mb-8 items-center">
        <h2 className="text-3xl font-serif font-bold">Vista Previa de Impresión</h2>
        <button 
          className="flex items-center px-6 py-3 bg-brand-dark text-white rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
          onClick={() => alert("Función de descarga simulada. En una app real, esto generaría un PDF.")}
        >
          <Download className="w-5 h-5 mr-2" />
          Descargar PDF
        </button>
      </div>

      <div className="w-full max-w-4xl bg-[#F5F5F0] p-12 shadow-2xl mb-20">
        {/* Cover Page */}
        {album.coverImage && (
          <div className="w-full aspect-[3/4] mb-4 shadow-lg relative print:break-after-page overflow-hidden group">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" style={{ backgroundImage: `url(${album.coverImage})` }}></div>
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60"></div>
            
            {/* Title Overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-16 z-10">
               <div className="flex justify-center border-b border-white/30 pb-4">
                  <span className="text-white text-sm tracking-[0.4em] uppercase font-bold">The Collection</span>
               </div>
               
               <div className="text-center">
                  <h1 className="text-7xl md:text-8xl font-display text-white uppercase tracking-tighter leading-none drop-shadow-2xl mix-blend-overlay opacity-90">
                    {album.title}
                  </h1>
                  <p className="text-white/80 font-serif italic text-xl mt-4 tracking-widest">{album.date}</p>
               </div>
            </div>
          </div>
        )}

        {/* Inner Pages */}
        {album.pages.map((page, i) => (
          <div 
            key={page.id} 
            className="aspect-[3/4] p-12 mb-4 shadow text-gray-800 flex flex-col print:break-after-page relative mx-auto max-w-[800px]"
            style={{ backgroundColor: `${album.themeColor}15` }} // Apply tinted background
          >
            {/* Page Content */}
            <div className="flex-1 flex flex-col justify-center">
              <div className={`grid gap-4 ${page.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {page.photos.map(photo => (
                  <div key={photo.id} className="p-3 bg-white shadow-sm rotate-1 first:rotate-[-1deg] last:rotate-2 transition-transform hover:rotate-0 duration-300">
                    <img src={photo.url} className="w-full h-auto object-cover aspect-square" />
                  </div>
                ))}
              </div>
              
              {page.anecdote && (
                <div className="mt-12 text-center px-8 relative">
                  <span className="text-6xl text-brand-dark/10 font-serif absolute -top-8 left-0">“</span>
                  <p className="font-serif italic text-xl leading-relaxed text-gray-700 relative z-10">
                    {page.anecdote}
                  </p>
                  <div className="w-16 h-0.5 mx-auto mt-6" style={{ backgroundColor: album.themeColor }}></div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="absolute bottom-6 left-0 w-full text-center text-xs text-gray-400 font-sans tracking-widest uppercase flex justify-center items-center gap-4">
               <span>—</span> {i + 1} <span>—</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 pb-20 font-sans selection:bg-brand-pink selection:text-white">
      <header className="bg-white border-b border-gray-100 py-4 px-6 flex items-center justify-between sticky top-0 z-40 bg-opacity-90 backdrop-blur-md">
        <div className="flex items-center space-x-2 text-brand-dark">
          <BookOpen className="w-6 h-6" />
          <span className="font-display text-xl tracking-wider uppercase">Memoria</span>
        </div>
        <div className="text-xs text-gray-400 font-medium px-3 py-1 bg-gray-100 rounded-full">
          AI Album Creator
        </div>
      </header>

      <StepWizard currentStep={currentStep} setStep={setCurrentStep} />

      <main className="container mx-auto px-4 py-8 md:py-12">
        {currentStep === AppStep.DETAILS && renderDetails()}
        {currentStep === AppStep.UPLOAD && renderUpload()}
        {currentStep === AppStep.STANDARDIZE && renderStandardize()}
        {currentStep === AppStep.EDIT && renderEdit()}
        {currentStep === AppStep.COVER && renderCover()}
        {currentStep === AppStep.PREVIEW && renderPreview()}
      </main>
    </div>
  );
};

export default App;