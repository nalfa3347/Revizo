import { IDataProvider } from '../contracts/IDataProvider';
import { ReferralInfo } from '../types';

export class ReferralService {
  constructor(private dataProvider: IDataProvider) {}

  /**
   * Récupère les informations de parrainage de l'élève
   */
  async getReferralInfo(): Promise<ReferralInfo> {
    const economy = await this.dataProvider.getEconomyState();
    return economy.referral;
  }

  /**
   * Récupère directement le code de parrainage unique de l'élève
   */
  async getReferralCode(): Promise<string> {
    const info = await this.getReferralInfo();
    return info.referralCode;
  }

  /**
   * Applique un code de parrainage saisi par l'élève
   */
  async applyReferralCode(code: string): Promise<{ success: boolean; message: string }> {
    return this.dataProvider.applyReferralCode(code);
  }

  /**
   * Partage le code de parrainage via l'API native du navigateur / téléphone
   */
  async shareReferralCode(code: string): Promise<{ shared: boolean; copied: boolean }> {
    const shareData = {
      title: 'Rejoins REVIZO✦',
      text: `Utilise mon code de parrainage ${code} sur REVIZO pour réviser plus vite et réussir tes cours !`,
      url: window.location.origin
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return { shared: true, copied: false };
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return { shared: false, copied: false };
        }
      }
    }

    // Repli vers copie presse-papiers
    try {
      await navigator.clipboard.writeText(code);
      return { shared: false, copied: true };
    } catch {
      return { shared: false, copied: false };
    }
  }
}
