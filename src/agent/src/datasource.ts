// Import Third-party Dependencies
import { GrafanaApi, Datasource as GrafanaDatasource } from "@myunisoft/loki";

export class Datasource {
  #lokiApi: GrafanaApi;

  private static datasource: Datasource;
  private static cache: GrafanaDatasource;

  private constructor(host: string) {
    this.#lokiApi = new GrafanaApi({
      remoteApiURL: host
    });
  }

  fetchDatasources() {
    return this.#lokiApi.Datasources.all();
  }

  static async Loki(host: string) {
    if (this.cache !== undefined) {
      return this.cache;
    }

    this.datasource ??= new Datasource(host);

    const datasources = await this.datasource.fetchDatasources();
    const lokiDatasources = datasources.filter((datasource) => datasource.type === "loki")!;
    const datasource = datasources.find((datasource) => datasource.isDefault) ?? lokiDatasources.at(0)!;
    this.cache = datasource;

    return datasource;
  }
}
