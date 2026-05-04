export function getFriendlyAuthError(error: unknown) {
  const code = (error as { code?: string })?.code

  switch (code) {
    case 'auth/email-already-in-use':
      return 'Esse e-mail já tem uma conta. Tente entrar ou use outro e-mail.'
    case 'auth/invalid-email':
      return 'Digite um e-mail válido.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha incorretos. Confira os dados e tente de novo.'
    case 'auth/weak-password':
      return 'Use uma senha com pelo menos 6 caracteres.'
    case 'auth/popup-closed-by-user':
      return 'Login cancelado. Você pode tentar de novo quando quiser.'
    case 'auth/too-many-requests':
      return 'Muitas tentativas seguidas. Espere um pouco e tente novamente.'
    default:
      return 'Não conseguimos concluir agora. Tente novamente em alguns instantes.'
  }
}
