function(n=6,Nsamples=10,nodesum=NULL,nodeIdx=NULL,nodeLabel=NULL){
  
  #This function finds alternative solutions to the Magic n-gon problem 
  #The nodes of the graph are numbered following and inward spiral rotating to the right. 
  #From any vertex node in the exterior, so an original vertex of the polygon, to the central node
  #
  #Arguments
  #
  #n: number of sides of the polygon (hexagon by default)
  #Nsamples: number of alternative solutions (they may be repeated)
  #nodesum: the required value for the sum of three nodes in a line. Default is the
  #minimum value, i.e. total number of vertices plus 3, 19 + 3 in the magic hexagon.
  #Of course, this constraint is not guaranteed to be feasible!
  #nodeIdx and nodeLabel: An optional, extra constraint which allows to fix a value to a 
  #given node. For instance, we can set node number 1 to have the value 12. Then nodeIdx=1
  #and nodeLabel=12. Of course this constraint is not guaranteed to be feasible!
  #
  #Requires the Gurobi solver (www.gurobi.com)
  #
  #***********Semidan Robaina Estevez, February 2017**************
  
  library("gurobi")
  Vnum = 3*n + 1
  if(is.null(nodesum)){nodesum = Vnum + 3}
  
  #Define topological matrix 
  O = matrix(0,2*n,3)
  Sidx = seq(1,2*n-3,2)
  for (i in seq(1,n-1)){
    O[i,] = seq(Sidx[i],Sidx[i]+2)
    O[n+i,] = c(Sidx[i],2*n+i,Vnum)
  }
  O[n,] = c(2*n-1,2*n,1)
  O[2*n,] = c(2*n-1,Vnum-1,Vnum)
  
  w = seq(1,Vnum)
  A1 = A2 = matrix(0,Vnum,Vnum^2)
  A3 = matrix(0,2*n,Vnum^2)
  N = matrix(0,Vnum,Nsamples)
  idx1 = 0
  idx2 = 1
  
  #Define constraints matrix A
  for (i in seq(1,Vnum)){
    
    A1[i,(idx1+1):(idx1+Vnum)] = rep(1,Vnum)
    idx1 = idx1+Vnum
    
    A2[i,seq(idx2,Vnum^2,Vnum)] = 1
    idx2 = idx2+1
  }
  for (i in seq(1,2*n)){
    
    A3[i,c(((O[i,1]-1)*Vnum+1):(((O[i,1]-1)*Vnum+1)+Vnum-1))] = w
    A3[i,c(((O[i,2]-1)*Vnum+1):(((O[i,2]-1)*Vnum+1)+Vnum-1))] = w
    A3[i,c(((O[i,3]-1)*Vnum+1):(((O[i,3]-1)*Vnum+1)+Vnum-1))] = w
    
  }
  A1 = cbind(A1,matrix(0,Vnum,Vnum^2))
  A2 = cbind(A2,matrix(0,Vnum,Vnum^2))
  A3 = cbind(A3,matrix(0,2*n,Vnum^2))
  
  Amat = rbind(A1,A2,A3)
  vecsense = rep("=",Vnum^2+2*Vnum+2*n)
  bvec = c(rep(1,2*Vnum),rep(nodesum,2*n))
  
  if(!is.null(nodeIdx) & !is.null(nodeLabel)){
    #Impose extra-constraints
    A4 = c(rep(0,2*(Vnum^2)))
    A4[(nodeIdx-1)*Vnum+nodeLabel] = 1
    Amat = rbind(Amat,A4)
    bvec = c(rep(1,2*Vnum),rep(nodesum,2*n),1)
    vecsense = rep("=",Vnum^2+2*Vnum+2*n+1)
  }
  Amat = rbind(Amat,cbind(diag(rep(1,Vnum^2)),diag(rep(1,Vnum^2))))
  
  #Solve MILP
  m = p = list()
  m$A = Amat
  m$Q = rbind(matrix(0,Vnum^2,2*(Vnum^2)),cbind(matrix(0,Vnum^2,Vnum^2),diag(rep(1,Vnum^2))))
  m$sense = vecsense
  m$rhs = bvec
  m$lb = c(rep(0,Vnum^2),rep(-10,Vnum^2))
  m$ub = c(rep(1,Vnum^2),rep(10,Vnum^2))
  m$obj = rep(0,2*(Vnum^2))
  m$vtypes = c(rep("B",Vnum^2),rep("C",Vnum^2))
  m$modelsense = "min"
  p$OutputFlag = 0
  
  #Main loop
  pb <- txtProgressBar(min = 1, max = Nsamples, style = 3)
  
  for(k in seq(1,Nsamples)){
    #Generate random point
    Sys.sleep(0.1)
    setTxtProgressBar(pb, k)
    brand = rep(0,Vnum^2)
    rs = sample(Vnum)
    for(l in seq(0,Vnum-1)){
      brand[Vnum*l+rs[l]] = 1
    }
    m$rhs = c(bvec,brand)
    
    #Retrieve solutions
    sol<-gurobi(m,p)
    idx1 = 0
    for(i in seq(1,Vnum)){
      N[i,k] = w%*%sol$x[(idx1+1):(idx1+Vnum)]
      idx1 = idx1+Vnum
    }
  }
  Sys.sleep(1)
  close(pb)
  return(N)
}