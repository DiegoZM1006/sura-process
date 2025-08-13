"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useOAuth } from '@/hooks/use-oauth';

export default function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError, showSuccess } = useToast();
  const { checkOAuthStatus } = useOAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Procesando autorización...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const success = searchParams.get('success');
        const userParam = searchParams.get('user');
        const error = searchParams.get('error');

        console.log('OAuth callback params:', { 
          success, 
          userParam: userParam || 'missing', 
          userParamDecoded: userParam ? decodeURIComponent(userParam) : 'missing',
          error 
        });

        if (error) {
          setStatus('error');
          setMessage(`Error de autorización: ${error}`);
          showError(`Error de autorización: ${error}`);
          return;
        }

        if (success === 'true' && userParam) {
          try {
            const user = JSON.parse(decodeURIComponent(userParam));
            console.log('Parsed user data:', user);
            
            // Verificar si el usuario tiene la propiedad authorized o si simplemente recibimos success=true
            const isAuthorized = user.authorized === true || success === 'true';
            
            if (isAuthorized) {
              setStatus('success');
              setMessage('¡Autorización completada exitosamente!');
              showSuccess('Gmail autorizado correctamente');
              
              // Verificar estado OAuth para actualizar el cache
              try {
                await checkOAuthStatus(true); // Forzar verificación para actualizar cache
              } catch (cacheError) {
                console.log('Could not update OAuth cache, but continuing...', cacheError);
              }
              
              // Redirigir al dashboard después de un breve delay
              setTimeout(() => {
                router.push('/dashboard');
              }, 2000);
            } else {
              console.warn('User data indicates not authorized:', user);
              setStatus('error');
              setMessage('Autorización incompleta');
              showError('La autorización no se completó correctamente');
            }
          } catch (parseError) {
            console.error('Error parsing user data:', parseError);
            setStatus('error');
            setMessage('Error procesando los datos de autorización');
            showError('Error procesando los datos de autorización');
          }
        } else {
          setStatus('error');
          setMessage('Respuesta de autorización inválida');
          showError('Respuesta de autorización inválida');
        }
      } catch (error) {
        console.error('Error processing OAuth callback:', error);
        setStatus('error');
        setMessage('Error procesando la autorización');
        showError('Error procesando la autorización');
      }
    };

    processCallback();
  }, [searchParams, router, showError, showSuccess, checkOAuthStatus]);

  const handleRetry = () => {
    router.push('/dashboard');
  };

  const handleGoBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Image 
            src="/btl-logo.svg" 
            alt="Logo" 
            width={200} 
            height={200} 
            className="mb-6" 
          />
          
          <div className="text-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                <p className="text-gray-600">{message}</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="h-8 w-8 mx-auto text-green-600" />
                <p className="text-gray-600">{message}</p>
                <p className="text-sm text-gray-500">Redirigiendo al dashboard...</p>
              </>
            )}
            
            {status === 'error' && (
              <>
                <XCircle className="h-8 w-8 mx-auto text-red-600" />
                <p className="text-gray-600">{message}</p>
                <div className="space-y-2 pt-4">
                  <Button onClick={handleRetry} className="w-full">
                    Ir al Dashboard
                  </Button>
                  <Button onClick={handleGoBack} variant="outline" className="w-full">
                    Volver al inicio
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
