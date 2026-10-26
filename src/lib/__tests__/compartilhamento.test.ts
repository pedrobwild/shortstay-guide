import { describe,expect,it } from "vitest";
import { linksCompartilhamento } from "@/lib/compartilhamento";
import { SEO_BAIRROS } from "@/lib/seo";
import { destinoAposLogin } from "@/lib/loginDestino";
describe("links para anúncios",()=>{
  it("inclui cada bairro público sem duplicação",()=>{const links=linksCompartilhamento();expect(links.filter((l)=>l.tipo==="Bairro")).toHaveLength(SEO_BAIRROS.length);expect(new Set(links.map((l)=>l.url)).size).toBe(links.length);});
  it("usa domínio oficial e inclui os dois comparadores",()=>{const urls=linksCompartilhamento().map((l)=>l.url);expect(urls).toContain("https://radarbewild.com.br/ranking");expect(urls).toContain("https://radarbewild.com.br/comparar");expect(urls).toContain("https://radarbewild.com.br/bairro/vila-olimpia");for(const url of urls)expect(new URL(url).origin).toBe("https://radarbewild.com.br");});
  it("permite retomar a tela somente como admin",()=>{expect(destinoAposLogin(true,"/admin/compartilhamento")).toBe("/admin/compartilhamento");expect(destinoAposLogin(false,"/admin/compartilhamento")).toBe("/area-exclusiva");});
});