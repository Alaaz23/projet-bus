import {Traget} from "./Target";

export class Station {
  id?: number;
  libelle!: string;
  longitude!: number;
  latitude!: number;
  traget?: Traget;
}
