export interface Application {
    title: string;
    description?: string;
    packageName: string;
    packageType: 'DEBIAN' | 'FLATPAK';
    icon?: string;
    categoryId?: number;
}
