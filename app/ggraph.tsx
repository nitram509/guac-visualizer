import { GetNeighborsDocument, IsDependency,  Source, GetPkgQueryVariables, PkgSpec , GetPkgDocument, AllPkgTreeFragment, Package, PackageNamespace, PackageName, PackageVersion ,CertifyPkg, Node as gqlNode, SourceNamespace, SourceName, Artifact, IsOccurrence, Builder, Osv, Ghsa, IsVulnerability, CertifyVexStatement, HashEqual, CertifyBad, CertifyScorecard, CertifyVuln, HasSourceAt, HasSbom, HasSlsa, OsvId, GhsaId, Cve, CveId} from '../gql/__generated__/graphql';


export type Node = {
  data: {
    id: string;
    label: string;
    type: string;
    data?: Object;
  };
}

export type Edge = {
  data: {
    source: string;
    target: string;
    label: string;
    id?: string;
  };
}

export type GraphData = {
  nodes: Node[];
  edges: Edge[];
}

export function ParseNode (n : gqlNode) : GraphData | undefined {
  
  let gd : GraphData;
  let target : Node | undefined;

  switch (n.__typename) {
    // SW trees
    case "Package":
      [gd, target]  = parsePackage(n);
      break;
    case "Source":
      [gd, target]  = parseSource(n);
      break;
    case "Artifact":
      [gd, target]  = parseArtifact(n);
      break;
    case "Builder":
      [gd, target]  = parseBuilder(n);
      break;
    case "CVE":
      [gd, target]  = parseCve(n);
      break;
    case "OSV":
      [gd, target]  = parseOsv(n);
      break;
    case "GHSA":
      [gd, target]  = parseGhsa(n);
      break;

    // Evidence trees
    case "IsDependency":
      [gd, target] = parseIsDependency(n);
      break;
    case "CertifyPkg":
      [gd, target] = parseCertifyPkg(n);
      break;
    case "IsOccurrence":
      [gd, target] = parseIsOccurrence(n);
      break;
    case "IsVulnerability":
      [gd, target] = parseIsVulnerability(n);
      break;
    case "CertifyVEXStatement":
      [gd, target] = parseCertifyVexStatement(n);
      break;
    case "HashEqual":
      [gd, target] = parseHashEqual(n);
      break;
    case "CertifyBad":
      [gd, target] = parseCertifyBad(n);
      break;
    case "CertifyScorecard":
      [gd, target] = parseCertifyScorecard(n);
      break;
    case "CertifyVuln":
      [gd, target] = parseCertifyVuln(n);
      break;
    case  "HasSourceAt":
      [gd, target] = parseHasSourceAt(n);
      break;
    case "HasSBOM":
      [gd, target] = parseHasSbom(n);
      break;
    case "HasSLSA":
      [gd, target] = parseHasSlsa(n);
      break;
    default:
      // not handled
      console.log("unhandled node type:", n.__typename);
      return undefined;
  }

  gd.edges.forEach(e => {e.data.id = e.data.source + "->" + e.data.target});


  return gd;
}

// parse* returns a set of GraphData that consists of the nodes and edges to create a subgraph
// it also returns the node which is the main node to link to of the subgraph
export function parsePackage(n: Package) : [GraphData, Node | undefined] {
    let nodes : Node[] = [];
    let edges : Edge[] = [];
    // for each check if its the leaf, and if its the leaf that's where the edge goes
    let target : Node | undefined = undefined;
  
  
    const typ : Package = n;
    nodes = [...nodes, {data: {id: typ.id, label: typ.type, type: "Package"}}];
    if (typ.namespaces.length == 0) {
      target = nodes.at(-1);
    }
  
    typ.namespaces.forEach((ns : PackageNamespace) =>{
      nodes = [...nodes, {data: {id: ns.id, label: ns.namespace, type: "Package"}}];
      edges = [...edges, {data: {source:typ.id, target:ns.id, label:"pkgNs"}}]
      if (ns.names.length == 0) {
        target = nodes.at(-1);
      }
  
      ns.names.forEach((name: PackageName)=>{
        nodes = [...nodes, {data: {id: name.id, label: name.name, type: "PackageName"}}];
        edges = [...edges, {data: { source:ns.id, target:name.id, label:"pkgName"}}]
        if (name.versions.length == 0) {
          target = nodes.at(-1);
        }
  
        name.versions.forEach((version: PackageVersion) => {
          nodes = [...nodes, {data: {...version, id: version.id, label: version.version, type: "PackageVersion" }}];
          edges = [...edges, {data: { source:name.id, target:version.id, label:"pkgVersion"}}]
          target = nodes.at(-1);
        });
      });
    });

    return [ { nodes: nodes, edges: edges }, target];
  }


export function parseSource(n: Source) : [GraphData, Node | undefined] {
  let nodes : Node[] = [];
  let edges : Edge[] = [];
  // for each check if its the leaf, and if its the leaf that's where the edge goes
  let target : Node | undefined = undefined;


  const typ : Source = n;
  nodes = [...nodes, {data: {id: typ.id, label: typ.type, type: "Source"}}];
  if (typ.namespaces.length == 0) {
    target = nodes.at(-1);
  }

  typ.namespaces.forEach((ns : SourceNamespace) =>{
    nodes = [...nodes, {data: {id: ns.id, label: ns.namespace, type: "Source"}}];
    edges = [...edges, {data: {source:typ.id, target:ns.id, label:"srcNs"}}]
    if (ns.names.length == 0) {
      target = nodes.at(-1);
    }

    ns.names.forEach((name: SourceName)=>{
      nodes = [...nodes, {data: {...name, id: name.id, label: name.name, type: "SourceName"}}];
      edges = [...edges, {data: {source:ns.id, target:name.id, label:"srcName"}}]
      target = nodes.at(-1);
    });
  });

  return [ { nodes: nodes, edges: edges }, target];
}

export function parseArtifact(n: Artifact) : [GraphData, Node | undefined] {
  let nodes : Node[] = [];
  let edges : Edge[] = [];
  let target : Node | undefined = undefined;

  nodes = [...nodes, {data: {...n, id: n.id, label: (n.algorithm + ":"+ n.digest).slice(0, 10), type: "Source"}}];
  target = nodes.at(-1);

  return [ { nodes: nodes, edges: edges }, target];
}


export function parseBuilder(n: Builder) : [GraphData, Node | undefined] {
  let nodes : Node[] = [];
  let edges : Edge[] = [];
  let target : Node | undefined = undefined;

  nodes = [...nodes, {data: {...n, id: n.id, label: n.uri, type: "Builder"}}];
  target = nodes.at(-1);

  return [ { nodes: nodes, edges: edges }, target];
}

export function parseOsv(n: Osv) : [GraphData, Node | undefined] {
  let nodes : Node[] = [];
  let edges : Edge[] = [];
  let target : Node | undefined = undefined;

  nodes = [...nodes, {data: {id: n.id, label: "osv", type: "Osv"}}];
  if (n.osvIds.length == 0) {
    target = nodes.at(-1);
  }

  n.osvIds.forEach((nn : OsvId) =>{
    nodes = [...nodes, {data: {id: nn.id, label: nn.osvId, type: "Osv"}}];
    edges = [...edges, {data: {source:n.id, target:nn.id, label:"osvId"}}]
      target = nodes.at(-1);
  });

  return [ { nodes: nodes, edges: edges }, target];
}

export function parseGhsa(n: Ghsa) : [GraphData, Node | undefined] {
  let nodes : Node[] = [];
  let edges : Edge[] = [];
  let target : Node | undefined = undefined;

  nodes = [...nodes, {data: {id: n.id, label: "ghsa", type: "Ghsa"}}];
  if (n.ghsaIds.length == 0) {
    target = nodes.at(-1);
  }

  n.ghsaIds.forEach((nn : GhsaId) =>{
    nodes = [...nodes, {data: {id: nn.id, label: nn.ghsaId, type: "Ghsa"}}];
    edges = [...edges, {data: {source:n.id, target:nn.id, label:"ghsaId"}}];
    target = nodes.at(-1);
  });

  return [ { nodes: nodes, edges: edges }, target];
}


export function parseCve(n: Cve) : [GraphData, Node | undefined] {
  let nodes : Node[] = [];
  let edges : Edge[] = [];
  let target : Node | undefined = undefined;

  nodes = [...nodes, {data: {id: n.id, label: n.year.toString(), type: "Cve"}}];
  if (n.cveIds.length == 0) {
    target = nodes.at(-1);
  }

  n.cveIds.forEach((nn : CveId) =>{
    nodes = [...nodes, {data: {id: nn.id, label: nn.cveId, type: "Cve"}}];
    edges = [...edges, {data: {source:n.id, target:nn.id, label:"cveId"}}];
    target = nodes.at(-1);
  });

  return [ { nodes: nodes, edges: edges }, target];
}

export function parseIsVulnerability(n: IsVulnerability) : [GraphData, Node | undefined] {
  let nodes : Node[] = [];
  let edges : Edge[] = [];
  let target : Node | undefined = undefined;


  nodes = [...nodes, {data: {...n, id: n.id, label: "vuln", type: "IsVulnerability" }}];
  target = nodes.at(-1);
  

  let [gd, t] = parseOsv(n.osv);
  nodes = [...nodes, ...gd.nodes];
  edges = [...edges, ...gd.edges];

  if (t != undefined) {
    edges = [...edges, {data: {source: n.id, target: t.data.id, label:"subject"}}]
  }

  if (n.vulnerability.__typename == "CVE") {
    [gd, t] = parseCve(n.vulnerability);
    nodes = [...nodes, ...gd.nodes];
    edges = [...edges, ...gd.edges];
    if (t != undefined) {
      edges = [...edges, {data: {source: n.id, target: t.data.id, label:"is_vulnerability"}}]
    }
  } else if (n.vulnerability.__typename == "GHSA") {
    [gd, t] = parseGhsa(n.vulnerability);
    nodes = [...nodes, ...gd.nodes];
    edges = [...edges, ...gd.edges];
    if (t != undefined) {
      edges = [...edges, {data: {source: n.id, target: t.data.id, label:"is_vulnerability"}}]
    }
  }

  return [ { nodes: nodes, edges: edges }, target];
}


export function parseCertifyVuln(n: CertifyVuln) : [GraphData, Node | undefined] {
  let nodes : Node[] = [];
  let edges : Edge[] = [];
  let target : Node | undefined = undefined;


  nodes = [...nodes, {data: {...n, id: n.id, label: "CertifyVuln", type: "CertifyVuln" }}];
  target = nodes.at(-1);
  

  let [gd, t] = parsePackage(n.package);
  nodes = [...nodes, ...gd.nodes];
  edges = [...edges, ...gd.edges];

  if (t != undefined) {
    edges = [...edges, {data: {source: n.id, target: t.data.id, label:"subject"}}]
  }
  
  if (n.vulnerability.__typename == "CVE") {
    [gd, t] = parseCve(n.vulnerability);
    nodes = [...nodes, ...gd.nodes];
    edges = [...edges, ...gd.edges];
    if (t != undefined) {
      edges = [...edges, {data: {source: n.id, target: t.data.id, label:"is_vulnerability"}}]
    }
  } else if (n.vulnerability.__typename == "GHSA") {
    [gd, t] = parseGhsa(n.vulnerability);
    nodes = [...nodes, ...gd.nodes];
    edges = [...edges, ...gd.edges];
    if (t != undefined) {
      edges = [...edges, {data: {source: n.id, target: t.data.id, label:"is_vulnerability"}}]
    }
  } else if (n.vulnerability.__typename == "OSV") {
    [gd, t] = parseOsv(n.vulnerability);
    nodes = [...nodes, ...gd.nodes];
    edges = [...edges, ...gd.edges];
    if (t != undefined) {
      edges = [...edges, {data: {source: n.id, target: t.data.id, label:"is_vulnerability"}}]
    }
  }

  return [ { nodes: nodes, edges: edges }, target];
}

export function parseCertifyVexStatement(n: CertifyVexStatement) : [GraphData, Node | undefined] {
  let nodes : Node[] = [];
  let edges : Edge[] = [];
  let target : Node | undefined = undefined;


  nodes = [...nodes, {data: {...n, id: n.id, label: "CertifyVexStatement", type: "CertifyVexStatement" }}];
  target = nodes.at(-1);
  
  let gd : GraphData;
  let t : Node | undefined;

  if (n.subject.__typename == "Artifact") {
    [gd, t] = parseArtifact(n.subject)
    nodes = [...nodes, ...gd.nodes];
    edges = [...edges, ...gd.edges];

    if (t != undefined) {
      edges = [...edges, {data: {source: n.id, target: t.data.id, label:"subject"}}]
    }
  } else if (n.subject.__typename == "Package") {
    [gd, t] = parsePackage(n.subject)
    nodes = [...nodes, ...gd.nodes];
    edges = [...edges, ...gd.edges];

    if (t != undefined) {
      edges = [...edges, {data: {source: n.id, target: t.data.id, label:"subject"}}]
    }
  }
  
  if (n.vulnerability.__typename == "CVE") {
    [gd, t] = parseCve(n.vulnerability);
    nodes = [...nodes, ...gd.nodes];
    edges = [...edges, ...gd.edges];
    if (t != undefined) {
      edges = [...edges, {data: {source: n.id, target: t.data.id, label:"is_vulnerability"}}]
    }
  } else if (n.vulnerability.__typename == "GHSA") {
    [gd, t] = parseGhsa(n.vulnerability);
    nodes = [...nodes, ...gd.nodes];
    edges = [...edges, ...gd.edges];
    if (t != undefined) {
      edges = [...edges, {data: {source: n.id, target: t.data.id, label:"is_vulnerability"}}]
    }
  } else if (n.vulnerability.__typename == "OSV") {
    [gd, t] = parseOsv(n.vulnerability);
    nodes = [...nodes, ...gd.nodes];
    edges = [...edges, ...gd.edges];
    if (t != undefined) {
      edges = [...edges, {data: {source: n.id, target: t.data.id, label:"is_vulnerability"}}]
    }
  }

  return [ { nodes: nodes, edges: edges }, target];
}


export function parseHashEqual(n: HashEqual) : [GraphData, Node | undefined] {
  let nodes : Node[] = [];
  let edges : Edge[] = [];
  // for each check if its the leaf, and if its the leaf that's where the edge goes
  let target : Node | undefined = undefined;


  nodes = [...nodes, {data: {...n, id: n.id, label: "HashEqual", type: "HashEqual" }}];
  target = nodes.at(-1);

  n.artifacts.forEach((m) => {
    let [gd, t] = parseArtifact(m);
    nodes = [...nodes, ...gd.nodes];
    edges = [...edges, ...gd.edges];

    if (t != undefined) {
      edges = [...edges, {data: {source: n.id, target: t.data.id, label:"artEqual"}}]
    }
  });
 
  return [ { nodes: nodes, edges: edges }, target];
}



export function parseCertifyBad(n: CertifyBad) : [GraphData, Node | undefined] {
  let nodes : Node[] = [];
  let edges : Edge[] = [];
  let target : Node | undefined = undefined;

  nodes = [...nodes, {data: {...n, id: n.id, label: "CertifyVuln", type: "CertifyVuln" }}];
  target = nodes.at(-1);

  let gd : GraphData;
  let t : Node | undefined;
  
  if (n.subject.__typename == "Artifact") {
    [gd, t] = parseArtifact(n.subject);
    nodes = [...nodes, ...gd.nodes];
    edges = [...edges, ...gd.edges];
    if (t != undefined) {
      edges = [...edges, {data: {source: n.id, target: t.data.id, label:"is_vulnerability"}}]
    }
  } else if (n.subject.__typename == "Source") {
    [gd, t] = parseSource(n.subject);
    nodes = [...nodes, ...gd.nodes];
    edges = [...edges, ...gd.edges];
    if (t != undefined) {
      edges = [...edges, {data: {source: n.id, target: t.data.id, label:"is_vulnerability"}}]
    }
  } else if (n.subject.__typename == "Package") {
    [gd, t] = parsePackage(n.subject);
    nodes = [...nodes, ...gd.nodes];
    edges = [...edges, ...gd.edges];
    if (t != undefined) {
      edges = [...edges, {data: {source: n.id, target: t.data.id, label:"is_vulnerability"}}]
    }
  }

  return [ { nodes: nodes, edges: edges }, target];
}


export function parseCertifyScorecard(n: CertifyScorecard) : [GraphData, Node | undefined] {
  let nodes : Node[] = [];
  let edges : Edge[] = [];
  let target : Node | undefined = undefined;

  nodes = [...nodes, {data: {...n, id: n.id, label: "CertifyScorecard", type: "CertifyScorecard" }}];
  target = nodes.at(-1);

  let [gd, t] = parseSource(n.source)
  nodes = [...nodes, ...gd.nodes];
  edges = [...edges, ...gd.edges];
  if (t != undefined) {
    edges = [...edges, {data: {source: n.id, target: t.data.id, label:"has_scorecard"}}]
  }
  
  return [ { nodes: nodes, edges: edges }, target];
}


export function parseHasSourceAt(n: HasSourceAt) : [GraphData, Node | undefined] {
  let nodes : Node[] = [];
  let edges : Edge[] = [];
  let target : Node | undefined = undefined;

  nodes = [...nodes, {data: {...n, id: n.id, label: "CertifyScorecard", type: "CertifyScorecard" }}];
  target = nodes.at(-1);

  let [gd, t] = parsePackage(n.package);
  nodes = [...nodes, ...gd.nodes];
  edges = [...edges, ...gd.edges];
  if (t != undefined) {
    edges = [...edges, {data: {source: n.id, target: t.data.id, label:"subject"}}]
  }

  [gd, t] = parseSource(n.source)
  nodes = [...nodes, ...gd.nodes];
  edges = [...edges, ...gd.edges];
  if (t != undefined) {
    edges = [...edges, {data: {source: n.id, target: t.data.id, label:"has_source"}}]
  }

  return [ { nodes: nodes, edges: edges }, target];
}

export function parseHasSbom(n: HasSbom) : [GraphData, Node | undefined] {
  let nodes : Node[] = [];
  let edges : Edge[] = [];
  let target : Node | undefined = undefined;

  nodes = [...nodes, {data: {...n, id: n.id, label: "HasSbom", type: "HasSbom" }}];
  target = nodes.at(-1);

  let gd : GraphData;
  let t : Node | undefined;
  
  if (n.subject.__typename == "Source") {
    [gd, t] = parseSource(n.subject);
    nodes = [...nodes, ...gd.nodes];
    edges = [...edges, ...gd.edges];
    if (t != undefined) {
      edges = [...edges, {data: {source: n.id, target: t.data.id, label:"is_vulnerability"}}]
    }
  } else if (n.subject.__typename == "Package") {
    [gd, t] = parsePackage(n.subject);
    nodes = [...nodes, ...gd.nodes];
    edges = [...edges, ...gd.edges];
    if (t != undefined) {
      edges = [...edges, {data: {source: n.id, target: t.data.id, label:"is_vulnerability"}}]
    }
  }
  
  return [ { nodes: nodes, edges: edges }, target];
}


export function parseHasSlsa(n: HasSlsa) : [GraphData, Node | undefined] {
  let nodes : Node[] = [];
  let edges : Edge[] = [];
  let target : Node | undefined = undefined;

  nodes = [...nodes, {data: {...n, id: n.id, label: "HasSbom", type: "HasSbom" }}];
  target = nodes.at(-1);

  let gd : GraphData;
  let t : Node | undefined;

  [gd, t] = parseArtifact(n.subject);
  nodes = [...nodes, ...gd.nodes];
  edges = [...edges, ...gd.edges];
  if (t != undefined) {
    edges = [...edges, {data: {source: n.id, target: t.data.id, label:"subject"}}]
  }


  // TODO This should not be the case, change graphql and change this 
  if (!n.slsa) {return [gd, t]; };

  [gd, t] = parseBuilder(n.slsa.builtBy);
  nodes = [...nodes, ...gd.nodes];
  edges = [...edges, ...gd.edges];
  if (t != undefined) {
    edges = [...edges, {data: {source: n.id, target: t.data.id, label:"built_by"}}]
  }
  

  n.slsa.builtFrom.forEach((m) =>{
    [gd, t] = parseArtifact(m);
    nodes = [...nodes, ...gd.nodes];
    edges = [...edges, ...gd.edges];
    if (t != undefined) {
      edges = [...edges, {data: {source: n.id, target: t.data.id, label:"build_from"}}]
    }
  })

  return [ { nodes: nodes, edges: edges }, target];
}



// parse* returns a set of GraphData that consists of the nodes and edges to create a subgraph
// it also returns the node which is the main node to link to of the subgraph
export function parseIsDependency(n: IsDependency) : [GraphData, Node | undefined] {
  let nodes : Node[] = [];
  let edges : Edge[] = [];
  // for each check if its the leaf, and if its the leaf that's where the edge goes
  let target : Node | undefined = undefined;


  nodes = [...nodes, {data: {...n, id: n.id, label: "Dep", type: "IsDependency" }}];
  target = nodes.at(-1);

  let [gd, t] = parsePackage(n.package);
  nodes = [...nodes, ...gd.nodes];
  edges = [...edges, ...gd.edges];

  if (t != undefined) {
    edges = [...edges, {data: {source: n.id, target: t.data.id, label:"subject"}}]
  }

  [gd, t] = parsePackage(n.dependentPackage);
  nodes = [...nodes, ...gd.nodes];
  edges = [...edges, ...gd.edges];

  if (t != undefined) {
    edges = [...edges, {data: {source: n.id, target: t.data.id, label:"depends_on"}}]
  }

  return [ { nodes: nodes, edges: edges }, target];
}

export function parseCertifyPkg(n: CertifyPkg) : [GraphData, Node | undefined] {
  let nodes : Node[] = [];
  let edges : Edge[] = [];
  // for each check if its the leaf, and if its the leaf that's where the edge goes
  let target : Node | undefined = undefined;


  nodes = [...nodes, {data: {...n, id: n.id, label: "CertifyPkg", type: "CertifyPkg" }}];
  target = nodes.at(-1);

  n.packages.forEach((m) => {
    let [gd, t] = parsePackage(m);
    nodes = [...nodes, ...gd.nodes];
    edges = [...edges, ...gd.edges];

    if (t != undefined) {
      edges = [...edges, {data: {source: n.id, target: t.data.id, label:"pkgEqual"}}]
    }
  });
 
  return [ { nodes: nodes, edges: edges }, target];
}


export function parseIsOccurrence(n: IsOccurrence) : [GraphData, Node | undefined] {
  let nodes : Node[] = [];
  let edges : Edge[] = [];
  // for each check if its the leaf, and if its the leaf that's where the edge goes
  let target : Node | undefined = undefined;


  nodes = [...nodes, {data: {...n, id: n.id, label: "Occur", type: "IsOccurrence" }}];
  target = nodes.at(-1);

  let gd : GraphData;
  let t : Node | undefined;
  if (n.subject.__typename == "Package") {
    [gd, t] = parsePackage(n.subject);
    nodes = [...nodes, ...gd.nodes];
    edges = [...edges, ...gd.edges];
  
    if (t != undefined) {
      edges = [...edges, {data: {source: n.id, target: t.data.id, label:"subject"}}]
    }
  } else if (n.subject.__typename == "Source") {
    [gd, t] = parseSource(n.subject);
    nodes = [...nodes, ...gd.nodes];
    edges = [...edges, ...gd.edges];
  
    if (t != undefined) {
      edges = [...edges, {data: {source: n.id, target: t.data.id, label:"subject"}}]
    }
  }

  [gd, t] = parseArtifact(n.artifact);
  nodes = [...nodes, ...gd.nodes];
  edges = [...edges, ...gd.edges];

  if (t != undefined) {
    edges = [...edges, {data: {source: n.id, target: t.data.id, label:"is_occurrence"}}]
  }

  return [ { nodes: nodes, edges: edges }, target];
}