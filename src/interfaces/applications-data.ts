export interface Package {
    [x: string]: any;
    title: string;
    description?: string;
    packageName: string;
    packageType: 'DEBIAN' | 'FLATPAK';
    icon?: string;
}
export interface Group {
    title: string;
    description?: string;
    packagesNames: string[];
    icon?: string;
}

export interface ApplicationsData {
    applications: string[];
    groups: Group[];
};