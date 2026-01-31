import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * ImageCropper - Componente de recorte de imagem estilo WhatsApp/Instagram
 *
 * @param {string} imageSrc - URL da imagem (base64 ou URL)
 * @param {function} onSave - Callback com a imagem recortada em base64
 * @param {function} onCancel - Callback para cancelar
 * @param {number} outputSize - Tamanho do output em pixels (default: 300)
 * @param {string} outputFormat - Formato do output: 'image/jpeg' ou 'image/png'
 * @param {number} quality - Qualidade JPEG de 0 a 1 (default: 0.9)
 */
export default function ImageCropper({
  imageSrc,
  onSave,
  onCancel,
  outputSize = 300,
  outputFormat = 'image/jpeg',
  quality = 0.9
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  const CROP_SIZE = 280; // Tamanho da area de crop visivel
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3;

  // Carregar imagem
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageSize({ width: img.width, height: img.height });
      setImageLoaded(true);

      // Calcular scale inicial para cobrir a area de crop
      const minDimension = Math.min(img.width, img.height);
      const initialScale = CROP_SIZE / minDimension;
      setScale(Math.max(initialScale, MIN_SCALE));

      // Centralizar imagem
      setPosition({
        x: (CROP_SIZE - img.width * initialScale) / 2,
        y: (CROP_SIZE - img.height * initialScale) / 2
      });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Redesenhar canvas quando posicao/escala mudar
  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    // Limpar canvas
    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);

    // Desenhar imagem
    ctx.save();
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.drawImage(
      img,
      position.x,
      position.y,
      img.width * scale,
      img.height * scale
    );

    ctx.restore();
  }, [imageLoaded, position, scale]);

  // Handlers de drag
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [position]);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  }, [position]);

  const handleMove = useCallback((clientX, clientY) => {
    if (!isDragging || !imageRef.current) return;

    const img = imageRef.current;
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;

    let newX = clientX - dragStart.x;
    let newY = clientY - dragStart.y;

    // Limitar movimento para manter imagem dentro da area de crop
    const minX = CROP_SIZE - scaledWidth;
    const minY = CROP_SIZE - scaledHeight;

    newX = Math.min(0, Math.max(minX, newX));
    newY = Math.min(0, Math.max(minY, newY));

    setPosition({ x: newX, y: newY });
  }, [isDragging, dragStart, scale]);

  const handleMouseMove = useCallback((e) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [handleMove]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handler de zoom
  const handleZoom = useCallback((newScale) => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const clampedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));

    // Ajustar posicao para manter centralizado
    const scaleDiff = clampedScale / scale;
    const centerX = CROP_SIZE / 2;
    const centerY = CROP_SIZE / 2;

    const newX = centerX - (centerX - position.x) * scaleDiff;
    const newY = centerY - (centerY - position.y) * scaleDiff;

    // Limitar posicao
    const scaledWidth = img.width * clampedScale;
    const scaledHeight = img.height * clampedScale;
    const minX = CROP_SIZE - scaledWidth;
    const minY = CROP_SIZE - scaledHeight;

    setPosition({
      x: Math.min(0, Math.max(minX, newX)),
      y: Math.min(0, Math.max(minY, newY))
    });

    setScale(clampedScale);
  }, [scale, position]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(scale + delta);
  }, [scale, handleZoom]);

  // Salvar imagem recortada
  const handleSave = async () => {
    if (!imageRef.current) return;

    setSaving(true);

    try {
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = outputSize;
      outputCanvas.height = outputSize;
      const ctx = outputCanvas.getContext('2d');

      // Criar mascara circular
      ctx.beginPath();
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      ctx.clip();

      // Calcular proporcao
      const ratio = outputSize / CROP_SIZE;

      ctx.drawImage(
        imageRef.current,
        position.x * ratio,
        position.y * ratio,
        imageRef.current.width * scale * ratio,
        imageRef.current.height * scale * ratio
      );

      const croppedImage = outputCanvas.toDataURL(outputFormat, quality);
      onSave(croppedImage);
    } catch (error) {
      console.error('Erro ao recortar imagem:', error);
    } finally {
      setSaving(false);
    }
  };

  // Carregar nova imagem
  const handleLoadNew = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            imageRef.current = img;
            setImageSize({ width: img.width, height: img.height });

            const minDimension = Math.min(img.width, img.height);
            const initialScale = CROP_SIZE / minDimension;
            setScale(Math.max(initialScale, MIN_SCALE));

            setPosition({
              x: (CROP_SIZE - img.width * initialScale) / 2,
              y: (CROP_SIZE - img.height * initialScale) / 2
            });
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Event listeners globais para drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleMouseMove, handleTouchMove, handleEnd]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onCancel}
            className="btn btn-ghost btn-sm text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Fechar
          </button>

          <span className="text-white text-sm">Arraste a imagem para ajustar</span>

          <button
            onClick={handleLoadNew}
            className="btn btn-ghost btn-sm text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Carregar
          </button>
        </div>

        {/* Area de Crop */}
        <div className="flex justify-center mb-6">
          <div
            ref={containerRef}
            className="relative select-none"
            style={{ width: CROP_SIZE, height: CROP_SIZE }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onWheel={handleWheel}
          >
            {/* Imagem de fundo (para mostrar area fora do crop) */}
            {imageLoaded && imageRef.current && (
              <img
                src={imageSrc}
                alt=""
                className="absolute pointer-events-none opacity-30"
                style={{
                  width: imageRef.current.width * scale,
                  height: imageRef.current.height * scale,
                  transform: `translate(${position.x}px, ${position.y}px)`,
                  maxWidth: 'none'
                }}
                draggable={false}
              />
            )}

            {/* Canvas com mascara circular */}
            <canvas
              ref={canvasRef}
              width={CROP_SIZE}
              height={CROP_SIZE}
              className="absolute inset-0 cursor-move"
              style={{ touchAction: 'none' }}
            />

            {/* Borda circular */}
            <div
              className="absolute inset-0 rounded-full border-4 border-white pointer-events-none"
              style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }}
            />

            {/* Loading */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-white"></span>
              </div>
            )}
          </div>
        </div>

        {/* Controle de Zoom */}
        <div className="flex items-center gap-4 px-4 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>

          <input
            type="range"
            min={MIN_SCALE * 100}
            max={MAX_SCALE * 100}
            value={scale * 100}
            onChange={(e) => handleZoom(Number(e.target.value) / 100)}
            className="range range-primary range-sm flex-1"
          />

          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
        </div>

        {/* Botoes de Acao */}
        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="btn btn-ghost text-white min-w-32"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            className="btn btn-primary min-w-32"
            disabled={saving || !imageLoaded}
          >
            {saving ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Salvando...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Aplicar
              </>
            )}
          </button>
        </div>

        {/* Dicas */}
        <p className="text-center text-white/50 text-xs mt-4">
          Use o scroll do mouse ou o controle deslizante para ajustar o zoom
        </p>
      </div>
    </div>
  );
}
